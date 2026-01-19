from types import ModuleType
from typing import Any, Generic, TypeVar

from factory.alchemy import SQLAlchemyModelFactory
from factory.base import DictFactory
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Base

ModelType = TypeVar("ModelType", bound=Base)
PydanticModelType = TypeVar("PydanticModelType", bound=BaseModel)


class BaseFactory(SQLAlchemyModelFactory, Generic[ModelType]):
    class Meta:
        sqlalchemy_session: AsyncSession | None = None
        sqlalchemy_session_persistence = None

    @classmethod
    def create(cls, **kwargs: Any) -> ModelType:
        return super().create(**kwargs)

    @classmethod
    def create_batch(cls, size: int, **kwargs: Any) -> list[ModelType]:
        return super().create_batch(size, **kwargs)

    @classmethod
    def set_factory_session(cls, session: AsyncSession) -> None:
        cls._meta.__setattr__("sqlalchemy_session", session)

    @classmethod
    async def create_async(cls, **kwargs):
        instance = cls.create(**kwargs)
        if db := cls._meta.sqlalchemy_session:  # type: ignore
            assert isinstance(db, AsyncSession)
            db.add(instance)
            await db.commit()
        return instance

    @classmethod
    async def create_batch_async(cls, size: int, **kwargs):
        instances = cls.create_batch(size, **kwargs)
        if db := cls._meta.sqlalchemy_session:  # type: ignore
            assert isinstance(db, AsyncSession)
            db.add_all(instances)
            await db.commit()
        return instances


def set_factories_session(
    session: AsyncSession, factories: list[type[BaseFactory]] | ModuleType
) -> list[type[BaseFactory]]:
    """
    Set the session for all factories or a list of specified factories.
    """
    factory_classes = (
        factories
        if isinstance(factories, list)
        else [getattr(factories, factory) for factory in factories.__all__]
        if isinstance(factories, ModuleType)
        else []
    )
    for factory in factory_classes:
        factory.set_factory_session(session)
    return factory_classes


class BasePydanticFactory(DictFactory, Generic[PydanticModelType]):
    @classmethod
    def create(cls, **kwargs: Any) -> PydanticModelType:
        return super().create(**kwargs)

    @classmethod
    def create_batch(cls, size: int, **kwargs: Any) -> list[PydanticModelType]:
        return super().create_batch(size, **kwargs)

    @classmethod
    def create_dump(cls, **kwargs: Any) -> dict[str, Any]:
        instance: PydanticModelType = super().create(**kwargs)
        return instance.model_dump(mode="json")

    @classmethod
    def create_batch_dumps(cls, size: int, **kwargs: Any) -> list[dict[str, Any]]:
        instances: list[PydanticModelType] = super().create_batch(size, **kwargs)
        return [instance.model_dump(mode="json") for instance in instances]
