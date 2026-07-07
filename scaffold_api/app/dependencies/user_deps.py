from typing import Annotated

from fastapi import Depends, HTTPException, Security
from fastapi.security import SecurityScopes

from app.core.auth import (
    AuthProvider,
    auth_provider_default,
    auth_scheme,
)
from app.db.crud import UserCRUD
from app.db.models import User
from app.dependencies.base_deps import AppDeps
from app.dependencies.db_deps import AsyncSessionMaker
from app.exceptions import AppExc


async def _get_current_user(
    async_session: AsyncSessionMaker,
    security_scopes: SecurityScopes,
    token: str = Depends(auth_scheme),
    provider: AuthProvider = Depends(auth_provider_default),
) -> User:
    """https://github.com/tiangolo/fastapi/discussions/9372"""
    if token is None:
        raise AppExc.AuthenticationFailed(detail="Not authenticated")
    auth_value = provider.set_authenticate_value(security_scopes)
    token_data = await provider.validate(token, auth_value, security_scopes)
    userinfo = provider.get_userinfo(token_data, auth_value)

    async with async_session() as db:
        user = await provider.get_or_create_user(db, userinfo)
    return user


def _check_email_verified_and_active(user: User) -> bool:
    if not UserCRUD.is_active(user):
        raise HTTPException(400, detail="Inactive user")
    if not UserCRUD.is_email_verified(user):
        raise HTTPException(403, detail="Email not verified")
    return True


class UserDeps(AppDeps):
    @staticmethod
    async def get_current_user(
        current_user: User = Depends(_get_current_user),
    ) -> User:
        return current_user

    @staticmethod
    async def get_current_active_user(
        current_user: User = Depends(_get_current_user),
    ) -> User:
        _check_email_verified_and_active(current_user)
        return current_user

    @staticmethod
    async def get_current_active_superuser(
        current_user: User = Depends(_get_current_user),
    ) -> User:
        if not UserCRUD.is_superuser(current_user):
            raise AppExc.PermissionRequired
        return current_user

    @staticmethod
    async def get_optional_current_active_user(
        session: AsyncSessionMaker,
        scopes: SecurityScopes,
        token: str = Depends(auth_scheme),
        provider: AuthProvider = Depends(auth_provider_default),
    ) -> User | None:
        if token is None:
            return None
        try:
            current_user = await _get_current_user(session, scopes, token, provider)
            _check_email_verified_and_active(current_user)
            return current_user
        except HTTPException:
            return None


CurrentUser = Annotated[User, Depends(UserDeps.get_current_user)]
CurrentActiveUser = Annotated[User, Depends(UserDeps.get_current_active_user)]
CurrentActiveSuperuser = Annotated[User, Depends(UserDeps.get_current_active_superuser)]
UserWithBasicPermission = Annotated[
    User, Security(UserDeps.get_current_active_user, scopes=["basic"])
]
UserWithProPermission = Annotated[
    User, Security(UserDeps.get_current_active_user, scopes=["pro"])
]
UserWithAccessPermission = Annotated[
    User, Security(UserDeps.get_current_active_user, scopes=["access"])
]
UserWithPrepayPermission = Annotated[
    User, Security(UserDeps.get_current_active_user, scopes=["prepay"])
]
UserWithShopAdminPermission = Annotated[
    User, Security(UserDeps.get_current_active_user, scopes=["shop_admin"])
]
OptionalCurrentActiveUser = Annotated[
    User | None, Depends(UserDeps.get_optional_current_active_user)
]
