from fastapi.security import SecurityScopes
from pytest import mark

from app.core.auth import auth_provider_default
from app.db.session import AsyncSessionLocal
from app.dependencies.user_deps import UserDeps


@mark.asyncio
async def test_optional_auth_no_token_returns_none() -> None:
    result = await UserDeps.get_optional_current_active_user(
        session=AsyncSessionLocal,
        scopes=SecurityScopes(),
        token=None,  # type: ignore[arg-type]  # auth_scheme yields str | None at runtime
        provider=auth_provider_default(),
    )
    assert result is None


@mark.asyncio
async def test_optional_auth_invalid_token_returns_none() -> None:
    """A stale/invalid bearer token must resolve to None on optional-auth
    routes rather than raising 401. Regression guard: the auth provider raises
    AppExceptionCase (not HTTPException), so the dependency must catch it.

    The invalid token fails validation before any DB session is opened, so no
    real session is exercised here.
    """
    result = await UserDeps.get_optional_current_active_user(
        session=AsyncSessionLocal,
        scopes=SecurityScopes(),
        token="clearly.not.a.valid.jwt",
        provider=auth_provider_default(),
    )
    assert result is None
