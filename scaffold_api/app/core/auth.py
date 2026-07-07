from abc import ABC, abstractmethod
from enum import StrEnum
from typing import Any, Generic, TypeVar

import httpx
import structlog
from fastapi.security import (
    OAuth2PasswordBearer,
    SecurityScopes,
)
from jose import jwt
from jose.exceptions import ExpiredSignatureError, JWTError
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app import schemas
from app.core.cache import cache
from app.core.config import settings
from app.core.security import ALGORITHM, get_rsa_key_from_jwks, get_token_issuer
from app.db.crud import UserCRUD
from app.db.models import User
from app.exceptions import AppExc

logger = structlog.stdlib.get_logger()

UserInfoType = TypeVar("UserInfoType", bound=schemas.UserInfo)

AUTH_FLOW = settings.AUTH_FLOW
AUTH_FAPI_ISSUER = settings.AUTH_FAPI_ISSUER
AUTH_FAPI_DOMAIN = settings.AUTH_FAPI_DOMAIN
AUTH_NEXT_ISSUER = settings.AUTH_NEXT_ISSUER
AUTH_NEXT_DOMAIN = settings.AUTH_NEXT_DOMAIN


class AuthProvider(ABC, Generic[UserInfoType]):
    @abstractmethod
    def __init__(self, iss: str, name: str, domain: str):
        self.iss = iss
        self.name = name
        self.domain = domain

    @abstractmethod
    async def validate(
        self, token: str, auth_value: str, security_scopes: SecurityScopes | None = None
    ) -> dict[str, Any]:
        pass

    @abstractmethod
    def get_userinfo(self, token_data: dict[str, Any], auth_value: str) -> UserInfoType:
        pass

    @abstractmethod
    async def get_or_create_user(
        self, db: AsyncSession, userinfo: UserInfoType
    ) -> User:
        pass

    def set_authenticate_value(self, security_scopes: SecurityScopes | None) -> str:
        if security_scopes and security_scopes.scopes:
            return f'Bearer scope="{security_scopes.scope_str}"'
        return "Bearer"

    async def _handle_token_validation_error(
        self, exc: Exception, auth_value: str
    ) -> None:
        if isinstance(exc, ExpiredSignatureError):
            raise AppExc.AuthenticationFailed(
                auth_value, detail="Access token has expired"
            ) from exc
        if isinstance(exc, JWTError | ValidationError):
            await logger.aexception(
                "token_invalid", message="Invalid access token", exc_info=True
            )
            raise AppExc.AuthenticationFailed(
                auth_value, detail="Invalid access token"
            ) from exc
        await logger.aexception(
            "token_validation_error",
            message="Unexpected error during token validation",
        )
        raise AppExc.AuthenticationFailed(
            auth_value, detail="Authentication failed"
        ) from exc


class FapiAuthProvider(AuthProvider):
    def __init__(
        self,
        iss: str = AUTH_FAPI_ISSUER,
        name: str = "fastapi",
        domain: str = AUTH_FAPI_DOMAIN,
    ):
        self.iss = iss
        self.name = name
        self.domain = domain

    async def validate(
        self, token: str, auth_value: str, security_scopes: SecurityScopes | None = None
    ) -> dict[str, Any]:
        auth_value = self.set_authenticate_value(security_scopes)
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
            token_scopes = payload.pop("scope", "").split(" ")
            sec_data = schemas.TokenSecurityPayload(**payload, scopes=token_scopes)
        except Exception as exc:
            await self._handle_token_validation_error(exc, auth_value)
        if security_scopes:
            self.authorize(sec_data, security_scopes, auth_value)
        return payload

    def get_userinfo(
        self, token_payload: dict[str, Any], auth_value: str
    ) -> schemas.UserInfoFAPI:
        try:
            userinfo = schemas.UserInfoFAPI(**token_payload)
        except ValidationError as exc:
            logger.warning("malformed_userinfo", exc_info=exc)
            raise AppExc.AuthenticationFailed(
                auth_value,
                detail="Authentication failed - Malformed user details supplied",
            ) from exc
        return userinfo

    async def get_or_create_user(
        self, db: AsyncSession, userinfo: schemas.UserInfoFAPI
    ) -> User:
        user = await UserCRUD.get(db, id=userinfo.id)
        if not user:
            # Never let the token payload drive privilege state: role/active/
            # is_superuser are set server-side from schema defaults. email_verified
            # is preserved so IdP-verified OAuth users are not locked out.
            userinfo_dict = userinfo.model_dump(
                exclude={"is_superuser", "role", "active"}
            )
            user_in = schemas.SuperUserCreate(**userinfo_dict)
            user = await UserCRUD.create(db, obj_in=user_in)
            await db.commit()
            if not user:
                raise AppExc.CreateFailed(obj=User.__name__)
        return user

    def authorize(
        self,
        sec_data: schemas.TokenSecurityPayload,
        security_scopes: SecurityScopes,
        auth_value: str,
    ) -> bool:
        for scope in security_scopes.scopes:
            if scope not in sec_data.scopes:
                raise AppExc.AuthenticationFailed(
                    auth_value,
                    detail=f"Not enough permissions - Missing scope: {scope}",
                )
        return True


class OAuthProvider(AuthProvider):
    def __init__(self, iss: str, name: str, domain: str):
        self.iss = iss
        self.name = name
        self.domain = domain

    async def validate(
        self, token: str, auth_value: str, security_scopes: SecurityScopes | None = None
    ) -> dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.domain}/userinfo",
                headers={"Authorization": f"{auth_value} {token}"},
            )
        if response.status_code != 200:
            await logger.awarning(
                "userinfo_request_error",
                status_code=response.status_code,
                response_text=response.text,
            )
            raise AppExc.AuthenticationFailed(auth_value)
        return response.json()

    def get_userinfo(
        self, token_payload: dict[str, Any], auth_value: str
    ) -> schemas.UserInfoOAuth:
        try:
            userinfo = schemas.UserInfoOAuth(**token_payload)
        except ValidationError as exc:
            logger.error("userinfo_error", exc_info=exc)
            raise AppExc.AuthenticationFailed(
                auth_value,
                detail="Authentication failed - Malformed user details supplied by identity provider",
            ) from exc
        return userinfo

    async def get_or_create_user(
        self,
        db: AsyncSession,
        userinfo: schemas.UserInfoOAuth,
    ) -> User:
        user = await UserCRUD.get_by_email(db, email=userinfo.email)
        if not user:
            # Never let the token payload drive privilege state: role/active/
            # is_superuser are set server-side from schema defaults. email_verified
            # is preserved so IdP-verified OAuth users are not locked out.
            userinfo_dict = userinfo.model_dump(
                exclude={"is_superuser", "role", "active"}
            )
            user_in = schemas.SuperUserCreate(**userinfo_dict)
            user = await UserCRUD.create(db, obj_in=user_in)
            await db.commit()
            if not user:
                raise AppExc.CreateFailed(obj=User.__name__)
        return user


class OAuthProviderJWKS(OAuthProvider):
    def __init__(
        self, *args, audience: str, algorithms: list[str] | None = None, **kwargs
    ):
        super().__init__(*args, **kwargs)
        self.jwks_cache_key = f"{self.name}:jwks"
        self.algorithms: list[str] = algorithms or ["RS256"]
        self.audience = audience

    async def get_jwks_from_server(self) -> dict:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.domain}/.well-known/jwks.json")
                response.raise_for_status()

        except httpx.HTTPError as exc:
            err_msg = f"Failed to get JWKS from OAuth provider {self.name}"
            await logger.aexception(
                "jwks_error_http",
                provider=self.name,
                domain=self.domain,
                error=str(exc),
            )
            raise AppExc.AuthenticationFailed(detail=err_msg) from exc

        except Exception as exc:
            err_msg = f"Unexpected error getting JWKS from OAuth provider {self.name}"
            await logger.aexception(
                "jwks_error_unexpected",
                provider=self.name,
                domain=self.domain,
                error=str(exc),
            )
            raise AppExc.AuthenticationFailed(detail=err_msg) from exc

        jwks = response.json()
        if not isinstance(jwks, dict) or "keys" not in jwks:
            err_msg = f"Invalid JWKS response from OAuth provider {self.name}"
            await logger.aexception(
                "jwks_error_invalid_resp",
                provider=self.name,
                domain=self.domain,
                error=err_msg,
            )
            raise AppExc.AuthenticationFailed(detail=err_msg)
        await logger.ainfo("jwks_fetched_from_server", provider=self.name)
        return jwks

    async def get_jwks(self) -> dict:
        jwks = await cache.get(self.jwks_cache_key)
        if jwks is None:
            await logger.ainfo("jwks_cache_miss")
            jwks = await self.get_jwks_from_server()
            await cache.set(
                self.jwks_cache_key, jwks, exp=settings.AUTH_JWKS_TTL_MINS * 60
            )
            await logger.ainfo("jwks_cached")
        else:
            await logger.ainfo("jwks_cache_hit")
        return jwks

    async def validate(
        self, token: str, auth_value: str, security_scopes: SecurityScopes | None = None
    ) -> dict[str, Any]:
        jwks = await self.get_jwks()
        rsa_key = get_rsa_key_from_jwks(jwks, token)
        try:
            payload = jwt.decode(
                token,
                key=rsa_key,
                algorithms=self.algorithms,
                audience=self.audience,
                issuer=self.iss,
            )
        except Exception as exc:
            await self._handle_token_validation_error(exc, auth_value)
        return payload


class NextProvider(OAuthProviderJWKS):
    def __init__(self):
        super().__init__(
            iss=AUTH_NEXT_ISSUER,
            name="next",
            domain=AUTH_NEXT_DOMAIN,
            audience=settings.AUTH_NEXT_AUDIENCE,
            algorithms=["RS256"],
        )


class GetAuthProvider:
    def __init__(self, auth_providers: dict[str, AuthProvider]) -> None:
        self.auth_providers = auth_providers

    def __call__(self, token: str) -> AuthProvider:
        try:
            iss = get_token_issuer(token)
        except JWTError as exc:
            logger.error("Failed to get token issuer")
            raise AppExc.AuthenticationFailed(
                detail="Authentication failed - Invalid token"
            ) from exc
        if not iss:
            logger.error("Token missing iss claim")
            raise AppExc.AuthenticationFailed(
                detail="Authentication failed - Token missing issuer claim"
            )
        if not (auth_provider := self.auth_providers.get(iss)):
            logger.error(
                f"Invalid iss: {iss}. "
                f"Must be one of: {', '.join(self.auth_providers.keys())}"
            )
            raise AppExc.AuthenticationFailed(
                detail="Authentication failed - Invalid token issuer"
            )
        return auth_provider


class DefaultAuthProvider:
    def __init__(
        self, auth_providers: dict[str, AuthProvider], default: str = ""
    ) -> None:
        default_provider_id = default or settings.AUTH_DEFAULT_ISS
        default_provider = None
        if not (default_provider := auth_providers.get(default_provider_id)):
            logger.error(
                f"Invalid AUTH_DEFAULT_ISS: {default_provider_id}. "
                f"Must be one of: {', '.join(auth_providers.keys())}"
            )
            raise AppExc.InternalServerError
        self.default_provider = default_provider

    def __call__(self) -> AuthProvider:
        return self.default_provider


class Scope(StrEnum):
    description: str

    ME = ("me", "Read info for the current user.")
    ACCESS = ("access", "Basic application access")
    ADMIN = ("admin", "Administrator access")

    def __new__(cls, value: str, description: str):
        obj = str.__new__(cls, value)
        obj._value_ = value
        obj.description = description
        return obj

    @classmethod
    def as_dict(cls) -> dict[str, str]:
        return {m.value: m.description for m in cls}

    @classmethod
    def as_set(cls, *scopes: "Scope") -> set[str]:
        return {s.value for s in scopes}


AVAILABLE_SCOPES_DICT = scopes = Scope.as_dict()


def get_auth_scheme():
    return OAuth2PasswordBearer(
        tokenUrl=f"{settings.API_V1_STR}/login/access-token",
        scopes=AVAILABLE_SCOPES_DICT,
        auto_error=False,
    )


auth_providers: dict[str, AuthProvider] = {
    AUTH_FAPI_ISSUER: FapiAuthProvider(),
}

auth_provider_default = DefaultAuthProvider(auth_providers)
auth_scheme = get_auth_scheme()


class TokenExchange:
    """
    Used to exchange tokens from other microservices
    and for refreshing tokens
    """

    auth_scheme = OAuth2PasswordBearer(
        tokenUrl=f"{settings.API_V1_STR}/token/exchange",
    )
    exchange_auth_providers: dict[str, AuthProvider] = {
        AUTH_NEXT_ISSUER: NextProvider(),
        AUTH_FAPI_ISSUER: FapiAuthProvider(),
    }
    auth_provider_lookup = GetAuthProvider(exchange_auth_providers)
    auth_provider_default = exchange_auth_providers[AUTH_NEXT_ISSUER]

    @classmethod
    async def get_user_from_token(cls, db: AsyncSession, token: str) -> User:
        provider = cls.auth_provider_lookup(token)
        token_data = await provider.validate(token, "Bearer")
        userinfo = provider.get_userinfo(token_data, "Bearer")
        user = await provider.get_or_create_user(db, userinfo)
        return user
