from unittest.mock import MagicMock, patch

from httpx import AsyncClient as AsyncTestClient
from pytest import mark
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    generate_email_verification_token,
    generate_password_reset_token,
    get_password_hash,
    verify_password,
)
from tests.factories import UserFactory


@mark.asyncio
async def test_get_access_token(client: AsyncTestClient) -> None:
    login_data = {
        "username": settings.FIRST_SUPERUSER,
        "password": settings.FIRST_SUPERUSER_PASSWORD.get_secret_value(),
    }
    r = await client.post("/login/access-token", data=login_data)
    tokens = r.json()
    assert r.status_code == 200
    assert "access_token" in tokens
    assert tokens["access_token"]


@mark.asyncio
async def test_use_access_token(
    client: AsyncTestClient, superuser_token_headers: dict[str, str]
) -> None:
    r = await client.post(
        "/login/test-token",
        headers=superuser_token_headers,
    )
    result = r.json()
    assert r.status_code == 200
    assert "email" in result


@mark.asyncio
@patch("app.services.user_serv.send_password_reset_email")
async def test_password_recovery(
    mock_send_email: MagicMock, client: AsyncTestClient
) -> None:
    generic_msg = (
        "If an account with that email exists, a password reset "
        "email has been sent - Please check your inbox"
    )
    user = await UserFactory.create_async()
    email = user.email
    resp = await client.post(f"/password-recovery/{email}")
    assert resp.status_code == 200
    assert resp.json()["msg"] == generic_msg
    mock_send_email.assert_called_once()
    assert mock_send_email.call_args.args[0] == email
    mock_send_email.reset_mock()

    # Unknown accounts must return an identical response (no enumeration).
    invalid_email = "not_in_db@gmail.com"
    resp = await client.post(f"/password-recovery/{invalid_email}")
    assert resp.status_code == 200
    assert resp.json()["msg"] == generic_msg
    mock_send_email.assert_not_called()


@mark.asyncio
async def test_reset_password_success(
    db: AsyncSession, client: AsyncTestClient
) -> None:
    old_password = "password123$"
    password = "newSecurePassword123"
    password_hash = get_password_hash(old_password)

    user = await UserFactory.create_async(password_hash=password_hash, active=True)
    reset_token = generate_password_reset_token(
        email=user.email, password_hash=user.password_hash
    )
    response = await client.post(
        "/reset-password",
        json={
            "token": reset_token,
            "password": password,
        },
    )
    assert response.status_code == 200
    assert response.json()["msg"] == "Password updated successfully"
    await db.refresh(user)
    assert user and user.password_hash
    assert user.password_hash != password_hash
    assert verify_password(password, user.password_hash)


@mark.asyncio
async def test_reset_password_invalid_token(
    db: AsyncSession, client: AsyncTestClient
) -> None:
    old_password = "password123$"
    password = "newSecurePassword123"
    password_hash = get_password_hash(old_password)

    user = await UserFactory.create_async(password_hash=password_hash, active=True)
    response = await client.post(
        "/reset-password",
        json={
            "token": "invalid_token",
            "password": password,
        },
    )
    assert response.status_code == 401
    assert (
        response.json()["detail"]
        == "Invalid or expired token - Please request a new password reset email"
    )
    await db.refresh(user)
    assert user and user.password_hash
    assert user.password_hash == password_hash


@mark.asyncio
async def test_reset_password_inactive_user(
    db: AsyncSession, client: AsyncTestClient
) -> None:
    old_password = "password123$"
    password = "newSecurePassword123"
    password_hash = get_password_hash(old_password)

    user = await UserFactory.create_async(password_hash=password_hash, active=False)
    reset_token = generate_password_reset_token(
        email=user.email, password_hash=user.password_hash
    )
    response = await client.post(
        "/reset-password",
        json={
            "token": reset_token,
            "password": password,
        },
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Inactive user"


@mark.asyncio
async def test_reset_password_token_is_single_use(
    db: AsyncSession, client: AsyncTestClient
) -> None:
    """A reset token is bound to the password it was issued for, so replaying
    it after a successful reset is rejected."""
    old_password = "password123$"
    password = "newSecurePassword123"
    password_hash = get_password_hash(old_password)

    user = await UserFactory.create_async(password_hash=password_hash, active=True)
    reset_token = generate_password_reset_token(
        email=user.email, password_hash=user.password_hash
    )
    payload = {"token": reset_token, "password": password}

    first = await client.post("/reset-password", json=payload)
    assert first.status_code == 200

    replay = await client.post("/reset-password", json=payload)
    assert replay.status_code == 401
    assert (
        replay.json()["detail"]
        == "Invalid or expired token - Please request a new password reset email"
    )


@mark.asyncio
async def test_verify_email(db: AsyncSession, client: AsyncTestClient) -> None:
    user = await UserFactory.create_async(active=True)
    verification_token = generate_email_verification_token(email=user.email)
    response = await client.post(
        "/verify-email",
        json={"token": verification_token},
    )
    assert response.status_code == 200
    assert response.json()["msg"] == "Email verified successfully"
    await db.refresh(user)
    assert user.email_verified


@mark.asyncio
async def test_verify_email_invalid_token(
    db: AsyncSession, client: AsyncTestClient
) -> None:
    user = await UserFactory.create_async(active=True)
    response = await client.post(
        "/verify-email",
        json={"token": "invalid_token"},
    )
    assert response.status_code == 401
    assert (
        response.json()["detail"]
        == "Invalid or expired token - Please request a new verification email"
    )
    await db.refresh(user)
    assert not user.email_verified


@mark.asyncio
@patch("app.services.user_serv.send_email_verification_email")
async def test_resend_verification_email(
    mock_send_email: MagicMock, db: AsyncSession, client: AsyncTestClient
) -> None:
    generic_msg = (
        "If an account with that email exists and is unverified, "
        "a verification email has been sent - Please check your inbox"
    )
    user = await UserFactory.create_async()
    email = user.email
    url = f"/resend-verification-email/{email}"

    response = await client.post(url)
    assert response.status_code == 200
    assert response.json()["msg"] == generic_msg
    mock_send_email.assert_called_once()
    mock_send_email.reset_mock()

    # Already-verified accounts return an identical response with no email
    # sent, so verification state cannot be enumerated.
    user.email_verified = True
    await db.flush()

    response = await client.post(url)
    assert response.status_code == 200
    assert response.json()["msg"] == generic_msg
    mock_send_email.assert_not_called()
