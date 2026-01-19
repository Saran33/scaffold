from collections.abc import AsyncGenerator
from typing import Any

import pytest
import pytest_asyncio
from httpx import AsyncClient as AsyncTestClient
from pydantic import EmailStr
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.core.config import settings
from app.db.models import User
from tests.utils.user import (
    get_or_create_user,
    get_superuser_token_headers,
    get_user_token_headers,
    random_email,
    user_authentication_headers,
)


@pytest_asyncio.fixture
def user_with_headers_factory(client: AsyncTestClient, db: AsyncSession):
    """
    Returns an async callable that can be used to create a user
    (with optional password, plan, etc.) via the UserFactory,
    then fetch auth headers for that user.
    """

    async def _get_or_create_user_with_headers(
        *,
        email: str | None = None,
        password: str | None = None,
        email_verified: bool = True,
        is_superuser: bool = False,
    ) -> tuple[User, dict[str, str]]:
        password = password or settings.UNIT_TEST_USER_PASSWORD

        user = await get_or_create_user(
            db=db,
            email=email,
            password=password,
            email_verified=email_verified,
            is_superuser=is_superuser,
        )

        headers = await user_authentication_headers(
            client=client,
            email=user.email,
            password=password,
        )

        return user, headers

    return _get_or_create_user_with_headers


@pytest_asyncio.fixture
async def superuser_token_headers(
    client: AsyncTestClient,
) -> AsyncGenerator[dict[str, str]]:
    headers = await get_superuser_token_headers(client)
    yield headers


@pytest_asyncio.fixture
async def user_token_headers(
    client: AsyncTestClient, db: AsyncSession
) -> AsyncGenerator[dict[str, str]]:
    headers = await get_user_token_headers(
        client=client, db=db, email=settings.UNIT_TEST_USER_EMAIL
    )
    yield headers


@pytest_asyncio.fixture
async def current_superuser(
    client: AsyncTestClient, superuser_token_headers: dict[str, str]
) -> AsyncGenerator[dict[str, Any]]:
    resp = await client.get("/users/me", headers=superuser_token_headers)
    yield resp.json()


@pytest_asyncio.fixture
async def current_user(
    client: AsyncTestClient, user_token_headers: dict[str, str]
) -> AsyncGenerator[dict[str, Any]]:
    resp = await client.get("/users/me", headers=user_token_headers)
    yield resp.json()


@pytest.fixture
def email() -> EmailStr:
    return random_email()


@pytest.fixture
def password(random_str: str) -> str:
    return random_str
