from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app import schemas
from app.core.config import settings
from app.dependencies.db_deps import AsyncSessionMaker
from app.dependencies.user_deps import CurrentUser
from app.services import AuthService, UserService

router = APIRouter()


@router.get("/healthcheck", response_model=schemas.MsgSchema)
async def health_check() -> Any:
    """
    Health check
    """
    return {"msg": "OK"}


@router.post("/login/access-token", response_model=schemas.TokenSchema)
async def login_access_token(
    async_session: AsyncSessionMaker,
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    by providing a username and password matching a user in the database.
    """
    if not settings.AUTH_FLOW_ALLOWS_CREDENTIALS:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="The server does not implement the requested authentication method",
        )
    async with async_session() as db:
        access_token = await AuthService.authenticate_credentials(
            db, form_data.username, form_data.password
        )
    return access_token


@router.post("/token/exchange", response_model=schemas.TokenSchema)
async def exchange_token(
    async_session: AsyncSessionMaker,
    body: schemas.JWTExchange,
) -> Any:
    """
    Exchange a received token for a new access token.
    """
    async with async_session() as db:
        access_token = await AuthService.exchange_jwt_for_access_token(db, body.token)
    return access_token


@router.post("/login/test-token", response_model=schemas.UserSchema)
async def test_token(*, current_user: CurrentUser) -> Any:
    """
    Test access token
    """
    return current_user


@router.post("/password-recovery/{email}", response_model=schemas.MsgSchema)
async def recover_password(*, async_session: AsyncSessionMaker, email: str) -> Any:
    """
    Password Recovery
    """
    async with async_session() as db:
        result_msg = await UserService.send_password_reset_email(db, email)
    return result_msg


@router.post("/reset-password", response_model=schemas.MsgSchema)
async def reset_password(
    *,
    async_session: AsyncSessionMaker,
    pswd_reset_data: schemas.PasswordReset,
) -> Any:
    """
    Reset password with a token from a password recovery email.
    For updating password, use the `/users/me/update-password` endpoint.
    """
    async with async_session.begin() as db:
        result_msg = await UserService.reset_password(db, pswd_reset_data)
    return result_msg


@router.post("/verify-email", response_model=schemas.MsgSchema)
async def verify_email(
    *,
    async_session: AsyncSessionMaker,
    body: schemas.EmailTokenSchema = Body(...),
):
    async with async_session.begin() as db:
        result_msg = await UserService.verify_email(db, body.token)
    return result_msg


@router.post("/resend-verification-email/{email}", response_model=schemas.MsgSchema)
async def resend_verification_email(
    *, async_session: AsyncSessionMaker, email: str
) -> Any:
    async with async_session.begin() as db:
        result_msg = await UserService.resend_verification_email(db, email)
    return result_msg
