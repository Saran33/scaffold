from httpx import AsyncClient as AsyncTestClient
from pydantic import EmailStr, SecretStr
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import create_access_token, get_unverified_claims
from app.db.crud import UserCRUD
from app.db.models import User
from app.schemas.base_schema import EmailAdapter
from app.schemas.user_schemas import UserUpdate
from tests.factories.user import UserFactory
from tests.utils.utils import random_lower_string


async def user_authentication_headers(
    *, client: AsyncTestClient, email: EmailStr, password: str
) -> dict[str, str]:
    data = {"username": email, "password": password}

    r = await client.post("/login/access-token", data=data)
    response = r.json()
    auth_token = response["access_token"]
    return {"Authorization": f"Bearer {auth_token}"}


async def create_user(
    *,
    email: str | None = None,
    password: str | None = None,
    email_verified: bool = True,
    is_superuser: bool = False,
) -> User:
    password = password or random_lower_string()
    user = await UserFactory.create_async(
        email=email,
        password=password,
        email_verified=email_verified,
        is_superuser=is_superuser,
    )
    return user


async def get_or_create_user(
    *,
    db: AsyncSession,
    email: EmailStr | None = None,
    password: str | None = None,
    email_verified: bool = True,
    is_superuser: bool = False,
) -> User:
    password = password or settings.UNIT_TEST_USER_PASSWORD
    if not email:
        user = None
    else:
        user = await UserCRUD.get_by_email(db, email=email)
    if not user:
        user = await create_user(
            email=email,
            password=password,
            email_verified=email_verified,
            is_superuser=is_superuser,
        )

    return user


async def create_or_update_user(
    *,
    db: AsyncSession,
    email: EmailStr | None = None,
    password: str | None = None,
    email_verified: bool = True,
    is_superuser: bool = False,
) -> User:
    password = password or settings.UNIT_TEST_USER_PASSWORD
    if not email:
        user = None
    else:
        user = await UserCRUD.get_by_email(db, email=email)
        if user:
            user_in_update = UserUpdate(password=SecretStr(password))
            user = await UserCRUD.update(db, db_obj=user, obj_in=user_in_update)
    if not user:
        user = await create_user(
            email=email,
            password=password,
            email_verified=email_verified,
            is_superuser=is_superuser,
        )

    return user


async def get_user_token_headers(
    *,
    client: AsyncTestClient,
    db: AsyncSession,
    email: EmailStr,
) -> dict[str, str]:
    """
    Return a valid token for the user with given email.

    If the user doesn't exist it is created first.
    """
    password = settings.UNIT_TEST_USER_PASSWORD
    await create_or_update_user(
        db=db,
        email=email,
        password=password,
    )
    return await user_authentication_headers(
        client=client, email=email, password=password
    )


async def get_superuser_token_headers(client: AsyncTestClient):
    return await user_authentication_headers(
        client=client,
        email=settings.FIRST_SUPERUSER,
        password=settings.FIRST_SUPERUSER_PASSWORD.get_secret_value(),
    )


def random_email() -> EmailStr:
    return EmailAdapter.validate_strings(
        f"{random_lower_string()}@{random_lower_string()}.com"
    )  # pyright: ignore


async def add_password_hash_to_request_user(
    db: AsyncSession, password_hash: str
) -> User:
    user = await UserCRUD.get_by_email(db, email=settings.UNIT_TEST_USER_EMAIL)
    assert user is not None, "User not found"
    user.password_hash = password_hash
    await db.commit()
    return user


def get_claims_from_token(token: str) -> dict[str, str]:
    token = token.replace("Bearer ", "")
    claims = get_unverified_claims(token)
    return claims


def get_scopes_from_token(token: str) -> set[str]:
    claims = get_claims_from_token(token)
    scopes = claims.get("scope", "").split()
    return set(scopes)


def get_user_id_from_token(token: str) -> int:
    claims = get_claims_from_token(token)
    if (id_str := claims.get("sub")) is None:
        raise ValueError("No sub found in token")
    return int(id_str)


def get_admin_token(user: User) -> str:
    """Generate access token for user with admin scope."""
    return create_access_token(
        subject=user.id,
        name=user.full_name or user.email,
        email=user.email,
        active=user.active,
        iss="test",
        scopes={"admin"},
    )
