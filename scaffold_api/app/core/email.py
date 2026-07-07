from datetime import datetime
from pathlib import Path
from typing import Any

import aiofiles
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from jinja2 import Environment, FileSystemLoader, select_autoescape
from pydantic import BaseModel, EmailStr, SecretStr

from app.core.config import settings
from app.core.security import (
    generate_email_verification_token,
    generate_password_reset_token,
)

EMAIL_TEMPLATES_PATH = Path(Path(__file__).parent.parent) / settings.EMAIL_TEMPLATES_DIR


conf = ConnectionConfig(
    MAIL_USERNAME=settings.SMTP_USER or "",
    MAIL_PASSWORD=settings.SMTP_PASSWORD or SecretStr(""),
    MAIL_FROM=settings.EMAILS_FROM_EMAIL or "",
    MAIL_FROM_NAME=settings.EMAILS_FROM_NAME or "",
    MAIL_PORT=settings.SMTP_PORT or 587,
    MAIL_SERVER=settings.SMTP_HOST or "",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)


class EmailSchema(BaseModel):
    email: list[EmailStr]
    body: str
    subject: str


jinja2Env = Environment(
    loader=FileSystemLoader(EMAIL_TEMPLATES_PATH),
    autoescape=select_autoescape(["html", "xml"]),
)


async def render_template(template_name: str, context: dict[str, Any]) -> str:
    async with aiofiles.open(EMAIL_TEMPLATES_PATH / template_name) as f:
        template_str = await f.read()
    template = jinja2Env.from_string(template_str)
    return template.render(**context)


def _set_default_email_context(context: dict[str, Any]) -> dict[str, Any]:
    return {
        **context,
        "project_name": settings.PROJECT_NAME.capitalize(),
        "site_url": settings.SITE_URL,
        "support_email": settings.SUPPORT_EMAIL,
        "business_name": settings.BUSINESS_NAME,
        "business_address": settings.BUSINESS_ADDRESS,
        "copyright_year": str(datetime.now().year),
    }


async def send_email(
    email_to: str, subject: str, template_name: str, context: dict[str, Any]
) -> None:
    context = _set_default_email_context(context)
    rendered_template = await render_template(template_name, context)
    message = MessageSchema(
        subject=subject,
        recipients=[email_to],
        body=rendered_template,
        subtype=MessageType.html,
    )

    fm = FastMail(conf)
    await fm.send_message(message)


async def send_test_email(email_to: str) -> None:
    subject = f"{settings.PROJECT_NAME} - Test email"
    context = {
        "email": email_to,
    }
    await send_email(email_to, subject, "test_email.html", context)


async def send_new_account_email(email_to: str, username: str) -> None:
    project_name = settings.PROJECT_NAME
    subject = f"To get started on {project_name}, verify your email address"
    token = generate_email_verification_token(email_to)
    context = {
        "username": username,
        "email": email_to,
        "link": f"{settings.SITE_URL}/verify-email?token={token}",
    }
    await send_email(email_to, subject, "new_account.html", context)


async def send_reset_password_email(
    email_to: str, username: str, password_hash: str | None = None
) -> None:
    subject = "Reset your password"
    token = generate_password_reset_token(email=email_to, password_hash=password_hash)
    context = {
        "username": username,
        "email": email_to,
        "valid_hours": settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS,
        "link": f"{settings.SITE_URL}/reset-password?token={token}",
    }
    await send_email(email_to, subject, "reset_password.html", context)
