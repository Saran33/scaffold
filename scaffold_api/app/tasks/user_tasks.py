import structlog

from app.core.email import send_new_account_email, send_reset_password_email
from app.db.crud import UserCRUD
from app.db.session import async_task_db_session

logger = structlog.stdlib.get_logger()


async def send_email_verification_email(user_id: int):
    async with async_task_db_session() as db:
        user = await UserCRUD.get(db, user_id)
        if not user:
            raise Exception(f"User not found: {user_id}")
        await logger.ainfo("email_sending", email=user.email, id=user.id)
        await send_new_account_email(email_to=user.email, username=user.email)
        await logger.ainfo("email_sent", email=user.email, id=user.id)


async def send_password_reset_email(email: str):
    await logger.ainfo("password_reset_email_sending", email=email)
    await send_reset_password_email(email_to=email, username=email)
    await logger.ainfo("password_reset_email_sent", email=email)
