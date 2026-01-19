from pytest import mark

from app.core.auth import Scope
from tests.utils.user import get_scopes_from_token


@mark.asyncio
async def test_token_scopes_regular_user(
    user_token_headers: dict[str, str],
):
    """Test that a regular user gets basic scopes."""
    scopes = get_scopes_from_token(user_token_headers["Authorization"])

    assert Scope.ME.value in scopes
    assert Scope.ACCESS.value in scopes
    assert Scope.ADMIN.value not in scopes


@mark.asyncio
async def test_token_scopes_superuser_has_all_access(
    superuser_token_headers: dict[str, str],
):
    """Test that a superuser gets all access scopes."""
    scopes = get_scopes_from_token(superuser_token_headers["Authorization"])

    assert Scope.ME.value in scopes
    assert Scope.ADMIN.value in scopes
    assert Scope.ACCESS.value in scopes
