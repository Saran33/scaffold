from typing import Any

from fastapi import APIRouter, HTTPException, status

from app import schemas
from app.core.config import settings
from app.db.crud import UserCRUD
from app.dependencies.db_deps import AsyncSessionMaker
from app.dependencies.user_deps import (
    CurrentActiveSuperuser,
    CurrentActiveUser,
)
from app.services.user_serv import UserService

router = APIRouter()


@router.get("", response_model=list[schemas.UserSchema])
async def read_users(
    *,
    async_session: AsyncSessionMaker,
    skip: int = 0,
    limit: int = 100,
    current_user: CurrentActiveSuperuser,
) -> Any:
    """
    Retrieve users.
    """
    async with async_session() as db:
        users = await UserCRUD.get_multi(db, skip=skip, limit=limit)
    return users


@router.post("", response_model=schemas.UserSchema, status_code=201)
async def create_user(
    *,
    async_session: AsyncSessionMaker,
    user_in: schemas.SuperUserCreate,
    current_user: CurrentActiveSuperuser,
) -> Any:
    """
    Create new user.
    """
    async with async_session.begin() as db:
        user = await UserService.create_user(db, user_in)
    return user


@router.get("/me", response_model=schemas.UserSchema)
async def read_user_me(
    *,
    current_user: CurrentActiveUser,
) -> Any:
    """
    Get current user.
    """
    return current_user


@router.put("/me", response_model=schemas.UserSchema)
async def update_user_me(
    *,
    async_session: AsyncSessionMaker,
    update_data: schemas.UserUpdate,
    current_user: CurrentActiveUser,
) -> Any:
    """
    Update own user.
    """
    async with async_session.begin() as db:
        user = await UserService.update_user_me(db, current_user, update_data)
    return user


@router.put("/me/update-password", response_model=schemas.MsgSchema)
async def update_password(
    *,
    async_session: AsyncSessionMaker,
    pswd_update_data: schemas.PasswordUpdate,
    current_user: CurrentActiveUser,
) -> Any:
    """
    Update own password.
    """
    async with async_session.begin() as db:
        result_msg = await UserService.update_password(
            db, current_user, pswd_update_data
        )
    return result_msg


@router.post("/open", response_model=schemas.UserSchema, status_code=201)
async def create_user_open(
    *,
    async_session: AsyncSessionMaker,
    user_with_passwd: schemas.UserCreateCredAuth,
) -> Any:
    """
    Create new user without the need to be logged in.
    """
    if not settings.AUTH_FLOW_ALLOWS_CREDENTIALS:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="The server does not implement the requested sign-up method",
        )
    user_in = schemas.UserCreate(**user_with_passwd.model_dump())
    async with async_session.begin() as db:
        user = await UserService.create_user_open(db, user_in)
    return user


@router.get("/{user_id}", response_model=schemas.UserSchema)
async def read_user_by_id(
    *,
    async_session: AsyncSessionMaker,
    current_user: CurrentActiveSuperuser,
    user_id: int,
) -> Any:
    """
    Get a specific user by id.
    """
    async with async_session() as db:
        user = await UserService.get_user(db, user_id)
    return user


@router.put("/{user_id}", response_model=schemas.UserSchema)
async def update_user(
    *,
    async_session: AsyncSessionMaker,
    user_id: int,
    user_in: schemas.SuperUserUpdate,
    current_user: CurrentActiveSuperuser,
) -> Any:
    """
    Update a user.
    """
    async with async_session.begin() as db:
        user = await UserService.update_user(db, user_id, user_in)
    return user
