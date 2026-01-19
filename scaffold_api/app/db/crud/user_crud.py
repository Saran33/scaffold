from typing import Any

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash, verify_password
from app.db.crud.base_crud import BaseCRUD
from app.db.models.user import User
from app.schemas.user_schemas import (
    SuperUserCreate,
    SuperUserUpdate,
    UserCreate,
    UserUpdate,
)


class UserCRUD(
    BaseCRUD[User, UserCreate | SuperUserCreate, UserUpdate | SuperUserUpdate]
):
    @classmethod
    async def get_by_email(cls, db: AsyncSession, email: str) -> User | None:
        stmt: Select[tuple[User]] = select(User).where(User.email == email)
        return (await db.execute(stmt)).scalar_one_or_none()

    @classmethod
    async def create(
        cls, db: AsyncSession, *, obj_in: UserCreate | SuperUserCreate
    ) -> User:
        data = obj_in.model_dump(mode="json")
        password = data.pop("password", None)
        if password:
            data["password_hash"] = get_password_hash(password)
        db_obj = User(**data)
        db.add(db_obj)
        await db.flush()
        return db_obj

    @classmethod
    async def update(
        cls,
        db: AsyncSession,
        *,
        db_obj: User,
        obj_in: UserUpdate | SuperUserUpdate | dict[str, Any],
    ) -> User:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True, mode="json")
        if update_data.get("password", None):
            password_hash = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["password_hash"] = password_hash
        return await super().update(db, db_obj=db_obj, obj_in=update_data)

    @classmethod
    async def authenticate_credentials(
        cls, db: AsyncSession, *, email: str, password: str
    ) -> User | None:
        user = await cls.get_by_email(db, email=email)
        if (
            user
            and user.password_hash
            and verify_password(password, user.password_hash)
        ):
            return user
        return None

    @staticmethod
    def is_active(user: User) -> bool:
        return user.active

    @staticmethod
    def is_email_verified(user: User) -> bool:
        return user.email_verified

    @staticmethod
    def is_superuser(user: User) -> bool:
        return user.is_superuser
