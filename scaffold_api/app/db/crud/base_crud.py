from collections.abc import Sequence
from typing import Any, Generic, TypeVar, get_args
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import (
    ColumnElement,
    Integer,
    Select,
    UnaryExpression,
    and_,
    exists,
    func,
    select,
)
from sqlalchemy.exc import NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.orm.attributes import InstrumentedAttribute
from sqlalchemy.sql.base import ExecutableOption

from app.db.models.base import BaseORMProtocol
from app.db.utils import db_jsonable_encoder
from app.utils import classproperty

ModelType = TypeVar("ModelType", bound=BaseORMProtocol[Any])
RelatedModelType = TypeVar("RelatedModelType", bound=BaseORMProtocol[Any])

CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

IncludeRelatedType = (
    InstrumentedAttribute[RelatedModelType]
    | InstrumentedAttribute[list[RelatedModelType]]
)
IncludeRelatedTupleType = tuple[
    InstrumentedAttribute[RelatedModelType]
    | InstrumentedAttribute[list[RelatedModelType]],
    ...,
]
IncludeRelatedArgType = IncludeRelatedType | IncludeRelatedTupleType
ExecutableOptionsArgType = ExecutableOption | tuple[ExecutableOption, ...]
OrderByType = InstrumentedAttribute | UnaryExpression
OrderByArgType = OrderByType | tuple[OrderByType, ...]


class BaseCRUD(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    CRUD object with default methods to Create, Read, Update, Delete.

    **Parameters**
    * `model`: A SQLAlchemy model class
    * `CreateSchemaType`, `UpdateSchemaType`: Pydantic schemas
    """

    __orig_bases__: tuple
    model: type[ModelType]

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        cls.model = cls._get_model()

    @classmethod
    def _get_model(cls) -> type[ModelType]:
        return get_args(cls.__orig_bases__[0])[0]

    @classproperty
    def model_name(cls) -> str:
        return cls.model.__name__

    @classmethod
    async def get(cls, db: AsyncSession, id: int | UUID) -> ModelType | None:
        stmt: Select[tuple[ModelType]] = select(cls.model).where(cls.model.id == id)
        return (await db.execute(stmt.limit(1))).scalar_one_or_none()

    @classmethod
    async def get_by(
        cls,
        db: AsyncSession,
        filters: tuple[ColumnElement[bool], ...] | ColumnElement[bool],
        *,
        include: IncludeRelatedArgType | None = None,
        options: ExecutableOptionsArgType | None = None,
    ) -> ModelType | None:
        stmt: Select[tuple[ModelType]] = select(cls.model)
        if include:
            if isinstance(include, tuple):
                for relationship in include:
                    stmt = stmt.options(selectinload(relationship))
            else:
                stmt = stmt.options(selectinload(include))
        if options:
            if isinstance(options, tuple):
                stmt = stmt.options(*options)
            else:
                stmt = stmt.options(options)
        if isinstance(filters, tuple):
            stmt = stmt.filter(and_(*filters))
        else:
            stmt = stmt.filter(filters)
        return (await db.execute(stmt.limit(1))).scalar_one_or_none()

    @classmethod
    async def get_multi(
        cls,
        db: AsyncSession,
        filters: tuple[ColumnElement[bool], ...] | ColumnElement[bool] | None = None,
        *,
        include: IncludeRelatedArgType | None = None,
        options: ExecutableOptionsArgType | None = None,
        order_by: OrderByArgType | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Sequence[ModelType]:
        stmt: Select[tuple[ModelType]] = select(cls.model)
        if include:
            if isinstance(include, tuple):
                for relationship in include:
                    stmt = stmt.options(selectinload(relationship))
            else:
                stmt = stmt.options(selectinload(include))
        if options:
            if isinstance(options, tuple):
                stmt = stmt.options(*options)
            else:
                stmt = stmt.options(options)
        if filters is not None:
            if isinstance(filters, tuple):
                stmt = stmt.filter(and_(*filters))
            else:
                stmt = stmt.filter(filters)
        if order_by is not None:
            if isinstance(order_by, tuple):
                stmt = stmt.order_by(*order_by)
            else:
                stmt = stmt.order_by(order_by)
        else:
            if isinstance(cls.model.id.property.columns[0].type, Integer):
                stmt = stmt.order_by(cls.model.id)
            else:
                stmt = stmt.order_by(cls.model.created_dt)
        return (await db.execute(stmt.offset(skip).limit(limit))).scalars().all()

    @classmethod
    async def get_multi_with_count(
        cls,
        db: AsyncSession,
        filters: tuple[ColumnElement[bool], ...] | ColumnElement[bool] | None = None,
        *,
        include: IncludeRelatedArgType | None = None,
        options: ExecutableOptionsArgType | None = None,
        order_by: OrderByArgType | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[Sequence[ModelType], int]:
        """
        Return a `(rows, total_count)` tuple.
        `rows`        = current page after `skip` / `limit`.
        `total_count` = number of rows that match `filters` *before* pagination.
        """

        # ---------- total count ----------
        count_stmt = select(func.count()).select_from(cls.model)
        if filters is not None:
            if isinstance(filters, tuple):
                count_stmt = count_stmt.filter(and_(*filters))
            else:
                count_stmt = count_stmt.filter(filters)

        total: int = (await db.execute(count_stmt)).scalar_one()

        # ---------- current page ----------
        rows = await cls.get_multi(
            db,
            filters,
            include=include,
            options=options,
            order_by=order_by,
            skip=skip,
            limit=limit,
        )

        return rows, total

    @classmethod
    async def get_multi_by_ids(
        cls,
        db: AsyncSession,
        *,
        ids: Sequence[Any],
    ) -> Sequence[ModelType]:
        stmt = select(cls.model).where(cls.model.id.in_(ids))
        return (await db.execute(stmt)).scalars().all()

    @classmethod
    async def create(cls, db: AsyncSession, *, obj_in: CreateSchemaType) -> ModelType:
        obj_in_data = db_jsonable_encoder(obj_in, by_alias=False)
        db_obj = cls.model(**obj_in_data)
        db.add(db_obj)
        await db.flush()
        return db_obj

    @classmethod
    async def create_multi(
        cls, db: AsyncSession, *, objs_in: Sequence[CreateSchemaType]
    ) -> bool:
        orm_objs_in = [
            cls.model(**db_jsonable_encoder(obj_in, by_alias=False))
            for obj_in in objs_in
        ]
        db.add_all(orm_objs_in)
        return True

    @classmethod
    async def create_multi_returning(
        cls, db: AsyncSession, *, objs_in: Sequence[CreateSchemaType]
    ) -> Sequence[ModelType]:
        """
        Create multiple objects and return the created objects with their primary keys set.
        The ORM will emit multiple INSERT statements instead of `executemany`.
        This is because the ORM needs to know the primary key of the inserted
        row to set it on the ORM object if it's an autoincrementing primary key.
        Therefore, we should only use this method when we need to return the created objects.
        """
        orm_objs_in = [
            cls.model(**db_jsonable_encoder(obj_in, by_alias=False))
            for obj_in in objs_in
        ]
        db.add_all(orm_objs_in)
        await db.flush()
        return orm_objs_in

    @classmethod
    async def update(
        cls,
        db: AsyncSession,
        *,
        db_obj: ModelType,
        obj_in: UpdateSchemaType | dict[str, Any],
    ) -> ModelType:
        obj_data = db_jsonable_encoder(db_obj, by_alias=False)
        update_data = db_jsonable_encoder(obj_in, by_alias=False, exclude_unset=True)
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        await db.flush()
        return db_obj

    @classmethod
    async def remove(cls, db: AsyncSession, *, id: int | UUID) -> ModelType:
        """
        TODO: Refactor tables to use `ON DELETE` instead of using the ORM to delete related objects.
        https://docs.sqlalchemy.org/en/20/orm/cascades.html#using-foreign-key-on-delete-cascade-with-orm-relationships
        """
        # obj = await db.get(cls.model, id)
        obj = await cls.get(db, id)
        if obj is None:
            raise NoResultFound(f"{cls.model_name} not found")
        await db.delete(obj)
        return obj

    @classmethod
    async def exists(cls, db: AsyncSession, id: int | UUID) -> bool | None:
        stmt = exists().where(cls.model.id == id).select()
        result = await db.scalar(stmt)
        return result
