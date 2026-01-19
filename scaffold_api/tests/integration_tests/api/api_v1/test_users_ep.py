from unittest.mock import MagicMock, patch

from httpx import AsyncClient as AsyncTestClient
from pydantic import EmailStr
from pytest import mark
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    get_password_hash,
    verify_password,
)
from app.db.crud import UserCRUD
from app.services.user_serv import settings as user_serv_settings
from tests.factories import UserFactory
from tests.utils.db import ignore_deassociated_warning
from tests.utils.user import add_password_hash_to_request_user


@mark.asyncio
async def test_get_users_superuser_me(
    client: AsyncTestClient, superuser_token_headers: dict[str, str]
) -> None:
    r = await client.get("/users/me", headers=superuser_token_headers)
    current_user = r.json()
    assert current_user
    assert current_user["active"] is True
    assert current_user["isSuperuser"]
    assert current_user["email"] == settings.FIRST_SUPERUSER


@mark.asyncio
async def test_get_users_normal_user_me(
    client: AsyncTestClient, user_token_headers: dict[str, str]
) -> None:
    r = await client.get("/users/me", headers=user_token_headers)
    current_user = r.json()
    assert current_user
    assert current_user["active"] is True
    assert current_user["isSuperuser"] is False
    assert current_user["email"] == settings.UNIT_TEST_USER_EMAIL


@mark.asyncio
@patch("app.services.user_serv.send_email_verification_email")
@mark.parametrize("emails_enabled", [True, False])
async def test_create_user_new_email(
    mock_send_email_verification_email: MagicMock,
    db: AsyncSession,
    client: AsyncTestClient,
    superuser_token_headers: dict,
    email: EmailStr,
    password: str,
    emails_enabled: bool,
) -> None:
    with patch.object(user_serv_settings, "EMAILS_ENABLED", emails_enabled):
        data = {"email": email, "password": password}
        r = await client.post(
            "/users",
            headers=superuser_token_headers,
            json=data,
        )
    assert 200 <= r.status_code < 300
    created_user = r.json()
    user = await UserCRUD.get_by_email(db, email=email)
    assert user
    assert user.email == created_user["email"]
    if emails_enabled:
        mock_send_email_verification_email.assert_called_with(user.id)
    else:
        mock_send_email_verification_email.assert_not_called()


@mark.asyncio
@patch("app.services.user_serv.send_email_verification_email")
async def test_create_user_with_restricted_fields_allowed(
    mock_send_email: MagicMock,
    client: AsyncTestClient,
    superuser_token_headers: dict[str, str],
    email: EmailStr,
    password: str,
) -> None:
    data = {
        "email": email,
        "password": password,
        "isSuperuser": True,
        "active": True,
        "emailVerified": True,
    }
    resp = await client.post(
        "/users",
        headers=superuser_token_headers,
        json=data,
    )
    assert resp.status_code == 201
    created_user = resp.json()
    assert created_user["isSuperuser"]
    assert created_user["active"]
    assert created_user["emailVerified"]


@mark.asyncio
async def test_create_user_existing_username(
    client: AsyncTestClient,
    superuser_token_headers: dict,
    email: EmailStr,
    password: str,
) -> None:
    ignore_deassociated_warning()
    await UserFactory.create_async(email=email)
    data = {"email": email, "password": password}
    r = await client.post(
        "/users",
        headers=superuser_token_headers,
        json=data,
    )
    created_user = r.json()
    assert r.status_code == 409
    assert "_id" not in created_user


@mark.asyncio
async def test_create_user_by_normal_user(
    client: AsyncTestClient,
    user_token_headers: dict[str, str],
    email: EmailStr,
    password: str,
) -> None:
    data = {"email": email, "password": password}
    r = await client.post(
        "/users",
        headers=user_token_headers,
        json=data,
    )
    assert r.status_code == 401


@mark.asyncio
@patch("app.services.user_serv.send_email_verification_email")
@mark.parametrize("emails_enabled", [True, False])
async def test_create_user_open_registration_success(
    mock_send_email_verification_email: MagicMock,
    db: AsyncSession,
    client: AsyncTestClient,
    email: EmailStr,
    password: str,
    emails_enabled: bool,
) -> None:
    data = {"email": email, "password": password}
    with patch.object(user_serv_settings, "EMAILS_ENABLED", emails_enabled):
        r = await client.post(
            "/users/open",
            json=data,
        )
    assert 200 <= r.status_code < 300
    created_user = r.json()
    user = await UserCRUD.get_by_email(db, email=email)
    assert user
    assert user.email == created_user["email"]
    if emails_enabled:
        mock_send_email_verification_email.assert_called_with(user.id)
    else:
        mock_send_email_verification_email.assert_not_called()


@mark.asyncio
async def test_create_user_open_registration_not_enabled(
    client: AsyncTestClient,
    email: EmailStr,
    password: str,
) -> None:
    with patch.object(user_serv_settings, "USERS_OPEN_REGISTRATION", False):
        data = {"email": email, "password": password}
        r = await client.post("/users/open", json=data)
    assert r.status_code == 403

    with patch.object(user_serv_settings, "AUTH_FLOW_ALLOWS_CREDENTIALS", False):
        data = {"email": email, "password": password}
        r = await client.post("/users/open", json=data)
    assert r.status_code == 501


@mark.asyncio
async def test_create_user_open_registration_existing_email(
    client: AsyncTestClient, email: EmailStr, password: str
) -> None:
    await UserFactory.create_async(email=email)
    data = {"email": email, "password": password}
    r = await client.post("/users/open", json=data)
    assert r.status_code == 409


@mark.asyncio
async def test_create_user_open_registration_invalid_email(
    client: AsyncTestClient, password: str
) -> None:
    data = {"email": "invalid_email", "password": password}
    r = await client.post("/users/open", json=data)
    assert r.status_code == 422


@mark.asyncio
@patch("app.services.user_serv.send_email_verification_email")
async def test_create_user_open_registration_restricted_fields_not_allowed(
    mock_send_email: MagicMock,
    client: AsyncTestClient,
    email: EmailStr,
    password: str,
) -> None:
    data = {
        "email": email,
        "password": password,
        "isSuperuser": True,
        "active": True,
        "emailVerified": True,
    }
    resp = await client.post("/users/open", json=data)
    assert resp.status_code == 201
    created_user = resp.json()
    assert not created_user["isSuperuser"]
    assert not created_user["emailVerified"]
    # new users are active by default. active==False is used to soft delete users
    assert created_user["active"]


@mark.asyncio
async def test_retrieve_users(
    client: AsyncTestClient, superuser_token_headers: dict
) -> None:
    await UserFactory.create_batch_async(2)
    r = await client.get("/users", headers=superuser_token_headers)
    all_users = r.json()

    assert len(all_users) > 1
    for item in all_users:
        assert "email" in item


@mark.asyncio
async def test_get_existing_user(
    db: AsyncSession, client: AsyncTestClient, superuser_token_headers: dict
) -> None:
    new_user = await UserFactory.create_async()
    user = await UserCRUD.get_by_email(db, email=new_user.email)
    assert user is not None, "User not found"
    user_id = user.id
    r = await client.get(
        f"/users/{user_id}",
        headers=superuser_token_headers,
    )
    assert 200 <= r.status_code < 300
    api_user = r.json()
    existing_user = await UserCRUD.get_by_email(db, email=user.email)
    assert existing_user
    assert existing_user.email == api_user["email"]


@mark.asyncio
async def test_update_user_as_superuser(
    db: AsyncSession,
    client: AsyncTestClient,
    superuser_token_headers: dict[str, str],
    email: EmailStr,
    password: str,
) -> None:
    user = await UserFactory.create_async()
    user = await UserCRUD.get_by_email(db, email=user.email)
    assert user is not None, "User not found"
    user_id = user.id
    data = {"email": email, "password": password}
    r = await client.put(
        f"/users/{user_id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert 200 <= r.status_code < 300
    updated_user = r.json()
    assert updated_user["email"] == email

    await db.refresh(user)
    assert user, "User not found"
    assert user.email == email


@mark.asyncio
async def test_update_user_as_superuser_restricted_fields_allowed(
    db: AsyncSession,
    client: AsyncTestClient,
    superuser_token_headers: dict[str, str],
    email: EmailStr,
    password: str,
) -> None:
    user = await UserFactory.create_async()
    user = await UserCRUD.get_by_email(db, email=user.email)
    assert user is not None, "User not found"
    assert user is not None, "User not found"
    user_id = user.id
    data = {
        "email": email,
        "password": password,
        "isSuperuser": True,
        "active": True,
        "emailVerified": True,
    }
    resp = await client.put(
        f"/users/{user_id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert resp.status_code == 200
    updated_user = resp.json()
    assert updated_user["isSuperuser"]
    assert updated_user["active"]
    assert updated_user["emailVerified"]


@mark.asyncio
async def test_update_user_no_permission(
    db: AsyncSession,
    client: AsyncTestClient,
    user_token_headers: dict[str, str],
    email: EmailStr,
    password: str,
) -> None:
    new_user = await UserFactory.create_async()
    user = await UserCRUD.get_by_email(db, email=new_user.email)
    assert user is not None, "User not found"
    user_id = user.id
    data = {"email": email, "password": password}
    r = await client.put(
        f"/users/{user_id}",
        headers=user_token_headers,
        json=data,
    )
    assert r.status_code == 401
    await db.refresh(user)
    assert user, "User not found"
    assert user.email != email


@mark.asyncio
async def test_user_me_update(
    db: AsyncSession,
    client: AsyncTestClient,
    user_token_headers: dict[str, str],
    email: EmailStr,
    password: str,
) -> None:
    user = await UserCRUD.get_by_email(db, email=settings.UNIT_TEST_USER_EMAIL)  # pyright: ignore
    assert user is not None, "User not found"
    data = {"email": email, "password": password}
    r = await client.put(
        "/users/me",
        headers=user_token_headers,
        json=data,
    )
    assert 200 <= r.status_code < 300
    updated_user = r.json()
    assert updated_user["email"] == email

    await db.refresh(user)
    assert user, "User not found"
    assert user.email == email


@mark.asyncio
async def test_user_me_update_password_success(
    db: AsyncSession,
    client: AsyncTestClient,
    user_token_headers: dict[str, str],
) -> None:
    old_password = "password123$"
    new_password = "newSecurePassword123"
    password_hash = get_password_hash(old_password)

    user = await add_password_hash_to_request_user(db, password_hash)

    response = await client.put(
        "/users/me/update-password",
        headers=user_token_headers,
        json={
            "old_password": old_password,
            "new_password": new_password,
        },
    )
    assert response.status_code == 200
    assert response.json()["msg"] == "Password updated successfully"
    await db.refresh(user)
    assert user and user.password_hash
    assert user.password_hash != password_hash
    assert verify_password(new_password, user.password_hash)


@mark.asyncio
async def test_user_me_update_password_invalid_token(
    db: AsyncSession,
    client: AsyncTestClient,
    user_token_headers: dict[str, str],
) -> None:
    old_password = "password123$"
    new_password = "newSecurePassword123"
    password_hash = get_password_hash(old_password)

    user = await add_password_hash_to_request_user(db, password_hash)
    user_token_headers["Authorization"] = "Bearer invalid_token"

    response = await client.put(
        "/users/me/update-password",
        headers=user_token_headers,
        json={
            "old_password": old_password,
            "new_password": new_password,
        },
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid access token"
    await db.refresh(user)
    assert user and user.password_hash
    assert user.password_hash == password_hash


@mark.asyncio
async def test_user_me_update_password_inactive_user(
    db: AsyncSession,
    client: AsyncTestClient,
    user_token_headers: dict[str, str],
) -> None:
    old_password = "password123$"
    new_password = "newSecurePassword123"
    password_hash = get_password_hash(old_password)

    user = await add_password_hash_to_request_user(db, password_hash)
    user.active = False
    await db.commit()

    response = await client.put(
        "/users/me/update-password",
        headers=user_token_headers,
        json={
            "old_password": old_password,
            "new_password": new_password,
        },
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Inactive user"


@mark.asyncio
async def test_user_me_update_password_incorrect_old_password(
    db: AsyncSession,
    client: AsyncTestClient,
    user_token_headers: dict[str, str],
) -> None:
    old_password = "password123$"
    new_password = "newSecurePassword123"
    password_hash = get_password_hash(old_password)

    await add_password_hash_to_request_user(db, password_hash)

    response = await client.put(
        "/users/me/update-password",
        headers=user_token_headers,
        json={
            "old_password": "wrong_password",
            "new_password": new_password,
        },
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect existing password"


@mark.asyncio
async def test_user_me_update_restricted_fields_not_allowed(
    db: AsyncSession,
    client: AsyncTestClient,
    user_token_headers: dict[str, str],
) -> None:
    user = await UserCRUD.get_by_email(db, email=settings.UNIT_TEST_USER_EMAIL)
    assert user is not None, "User not found"

    # if the user is inactive or unverified, it will return a 400 or 403 before the 422
    user.email_verified = True
    user.active = True
    await db.commit()

    assert not user.is_superuser
    assert user.email_verified
    assert user.active

    restricted_data = {"active": False, "isSuperuser": True, "email_verified": False}
    resp = await client.put(
        "/users/me",
        headers=user_token_headers,
        json=restricted_data,
    )
    assert resp.status_code == 200
    await db.refresh(user)
    assert user
    assert not user.is_superuser
    assert user.email_verified
    assert user.active
