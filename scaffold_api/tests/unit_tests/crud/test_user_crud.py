from fastapi.encoders import jsonable_encoder
from pydantic import EmailStr, SecretStr
from pytest import mark
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash, verify_password
from app.db.crud import UserCRUD
from app.schemas.user_schemas import (
    SuperUserCreate,
    SuperUserUpdate,
    UserCreate,
    UserUpdate,
)
from tests.factories import UserFactory
from tests.utils.utils import random_lower_string


@mark.asyncio
async def test_create_user(
    db: AsyncSession, email: EmailStr, password: SecretStr
) -> None:
    user_in = UserCreate(email=email, password=password)
    user = await UserCRUD.create(db, obj_in=user_in)
    assert user.email == email
    assert hasattr(user, "password_hash")


@mark.asyncio
async def test_create_superuser(
    db: AsyncSession, email: EmailStr, password: SecretStr
) -> None:
    user_in = SuperUserCreate(email=email, password=password, is_superuser=True)
    user = await UserCRUD.create(db, obj_in=user_in)
    assert user.email == email
    assert hasattr(user, "password_hash")
    assert user.is_superuser


@mark.asyncio
@mark.parametrize("is_authenticated", [True, False])
async def test_authenticate_user(
    is_authenticated: bool, db: AsyncSession, email: EmailStr | str
) -> None:
    password = random_lower_string()
    if is_authenticated:
        user = await UserFactory.create_async(password_hash=get_password_hash(password))
        email = user.email
    authenticated_user = await UserCRUD.authenticate_credentials(
        db, email=email, password=password
    )
    if is_authenticated:
        assert authenticated_user
        assert authenticated_user.email == email
    else:
        assert authenticated_user is None


@mark.asyncio
@mark.parametrize("active_user", [True, False])
async def test_check_if_user_is_active(active_user: bool) -> None:
    user = await UserFactory.create_async(active=active_user)
    is_active = UserCRUD.is_active(user)
    assert is_active == active_user


@mark.asyncio
@mark.parametrize("super_user", [True, False])
async def test_check_superuser(super_user: bool) -> None:
    if super_user:
        user = await UserFactory.create_async(is_superuser=True)
    else:
        user = await UserFactory.create_async()
    is_superuser = UserCRUD.is_superuser(user)
    assert is_superuser == super_user


@mark.asyncio
async def test_get_user(db: AsyncSession) -> None:
    user = await UserFactory.create_async()
    user_2 = await UserCRUD.get(db, id=user.id)
    assert user_2
    assert user.email == user_2.email
    assert jsonable_encoder(user, by_alias=False) == jsonable_encoder(
        user_2, by_alias=False
    )


@mark.asyncio
async def test_update_user(db: AsyncSession) -> None:
    user = await UserFactory.create_async()
    new_password = SecretStr(random_lower_string())
    user_in_update = UserUpdate(password=new_password, full_name="John Doe")
    await UserCRUD.update(db, db_obj=user, obj_in=user_in_update)
    user_in_db = await UserCRUD.get(db, id=user.id)
    assert user_in_db
    assert user.email == user_in_db.email
    assert user_in_db.password_hash
    assert verify_password(new_password.get_secret_value(), user_in_db.password_hash)
    assert user_in_db.full_name == "John Doe"


@mark.asyncio
async def test_update_superuser(db: AsyncSession) -> None:
    user = await UserFactory.create_async()
    new_password = SecretStr(random_lower_string())
    user_in_update = SuperUserUpdate(password=new_password, is_superuser=True)
    await UserCRUD.update(db, db_obj=user, obj_in=user_in_update)
    user_in_db = await UserCRUD.get(db, id=user.id)
    assert user_in_db
    assert user.email == user_in_db.email
    assert user_in_db.password_hash
    assert verify_password(new_password.get_secret_value(), user_in_db.password_hash)
    assert user_in_db.is_superuser
