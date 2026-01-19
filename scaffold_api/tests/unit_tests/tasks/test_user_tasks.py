from unittest.mock import MagicMock, patch
from urllib.parse import parse_qs, urlparse

from pytest import mark

from app.core.config import settings
from app.tasks import user_tasks
from tests.factories import UserFactory


@mark.asyncio
@patch("app.core.email.send_email")
async def test_send_email_verification_email(
    mock_send_new_account_email: MagicMock,
):
    user = await UserFactory.create_async()
    await user_tasks.send_email_verification_email(user_id=user.id)
    mock_send_new_account_email.assert_called_once()

    called_args, _ = mock_send_new_account_email.call_args
    assert called_args[0] == user.email
    assert (
        called_args[1]
        == f"To get started on {settings.PROJECT_NAME}, verify your email address"
    )
    assert called_args[2] == "new_account.html"

    context = called_args[3]
    link_arg = context["link"]
    parsed_url = urlparse(link_arg)
    query_params = parse_qs(parsed_url.query)

    assert context["username"] == user.email
    assert parsed_url.scheme in ["http", "https"]
    assert settings.SITE_URL in link_arg
    assert "/verify-email" in parsed_url.path
    assert "token" in query_params and query_params["token"][0]


@mark.asyncio
@patch("app.core.email.send_email")
async def test_password_reset(
    mock_send_email: MagicMock,
) -> None:
    user = await UserFactory.create_async()
    email = user.email

    await user_tasks.send_password_reset_email(email=email)
    mock_send_email.assert_called_once()

    called_args, _ = mock_send_email.call_args
    assert called_args[0] == email
    assert called_args[1] == "Reset your password"
    assert called_args[2] == "reset_password.html"

    context = called_args[3]
    link_arg = context["link"]
    parsed_url = urlparse(link_arg)
    query_params = parse_qs(parsed_url.query)

    assert context["username"] == user.email
    assert parsed_url.scheme in ["http", "https"]
    assert settings.SITE_URL in link_arg
    assert "/reset-password" in parsed_url.path
    assert "token" in query_params and query_params["token"][0]
