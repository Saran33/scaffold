from datetime import timedelta
from typing import Any

import structlog
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import Scope, TokenExchange
from app.core.config import settings
from app.core.security import create_access_token
from app.db.crud.user_crud import UserCRUD
from app.db.models import User
from app.services.base_serv import AppService

logger = structlog.stdlib.get_logger()


class AuthService(AppService):
    @classmethod
    async def create_enriched_access_token(
        cls, db: AsyncSession, user: User
    ) -> dict[str, Any]:
        """
        Creates an access token with scopes and other claims.
        """
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        iss = str(settings.AUTH_FAPI_ISSUER)

        # Get all applicable scopes from different sources
        scopes: set[str] = {Scope.ME}

        # All active users get access to the app
        if user.active:
            scopes.add(Scope.ACCESS)

        # Add admin scope based on role
        if user.role in ["admin"]:
            scopes.add(Scope.ADMIN)

        # Add superuser scopes
        if user.is_superuser:
            scopes.update(cls._get_superuser_scopes())

        return {
            "access_token": create_access_token(
                subject=user.id,
                name=user.full_name,
                email=user.email,
                active=user.active,
                iss=iss,
                scopes=scopes,
                expires_delta=access_token_expires,
            ),
            "token_type": "bearer",
        }

    @classmethod
    def _get_superuser_scopes(cls) -> set[str]:
        """Get the standard set of scopes for superusers."""
        return Scope.as_set(Scope.ADMIN)

    @classmethod
    async def authenticate_credentials(
        cls, db: AsyncSession, username: str, password: str
    ) -> dict[str, Any]:
        user = await UserCRUD.authenticate_credentials(
            db, email=username, password=password
        )
        if not user:
            raise HTTPException(status_code=401, detail="Incorrect email or password")
        return await cls.create_enriched_access_token(db, user)

    @classmethod
    async def exchange_jwt_for_access_token(
        cls, db: AsyncSession, jwt: str
    ) -> dict[str, Any]:
        user = await TokenExchange.get_user_from_token(db, jwt)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return await cls.create_enriched_access_token(db, user)
