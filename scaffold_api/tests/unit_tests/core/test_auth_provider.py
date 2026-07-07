from pytest import mark
from sqlalchemy.ext.asyncio import AsyncSession

from app import schemas
from app.core.auth import FapiAuthProvider


@mark.asyncio
async def test_provisioning_ignores_privilege_claims_keeps_email_verified(
    db: AsyncSession,
) -> None:
    """A user provisioned from a token must not inherit privilege state
    (role/is_superuser/active) from the payload, but email_verified is
    preserved so IdP-verified users are not locked out."""
    provider = FapiAuthProvider()
    userinfo = schemas.UserInfoFAPI(
        sub=987654,
        email="provisioned@example.org",
        name="Provisioned User",
        role="admin",
        is_superuser=True,
        active=False,
        email_verified=True,
    )

    user = await provider.get_or_create_user(db, userinfo)

    # Privilege/state fields come from server-side schema defaults, not the token.
    assert user.role == "user"
    assert user.is_superuser is False
    assert user.active is True
    # email_verified is preserved from the (trusted) token payload.
    assert user.email_verified is True


@mark.asyncio
async def test_provisioning_defaults_email_verified_when_absent(
    db: AsyncSession,
) -> None:
    """When the token does not assert email_verified, the new user defaults to
    unverified (schema default)."""
    provider = FapiAuthProvider()
    userinfo = schemas.UserInfoFAPI(
        sub=987655,
        email="unverified-provisioned@example.org",
        name="Unverified User",
        email_verified=False,
    )

    user = await provider.get_or_create_user(db, userinfo)

    assert user.email_verified is False
    assert user.role == "user"
    assert user.is_superuser is False
