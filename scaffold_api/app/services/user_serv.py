import structlog
from fastapi import HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic import EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    get_password_hash,
    verify_email_verification_token,
    verify_password,
    verify_password_reset_token,
)
from app.db.crud.user_crud import UserCRUD
from app.db.models import User
from app.exceptions import AppExc
from app.schemas.auth_schemas import PasswordReset, PasswordUpdate
from app.schemas.user_schemas import (
    SuperUserCreate,
    SuperUserUpdate,
    UserCreate,
    UserUpdate,
)
from app.services.base_serv import AppService
from app.tasks.user_tasks import (
    send_email_verification_email,
    send_password_reset_email,
)

logger = structlog.stdlib.get_logger()


class UserService(AppService):
    @staticmethod
    async def create_user(db: AsyncSession, user_in: SuperUserCreate) -> User:
        user = await UserCRUD.get_by_email(db, email=user_in.email)
        if user:
            raise AppExc.AlreadyExists(
                obj=User.__name__, field="email", value=user_in.email
            )
        user = await UserCRUD.create(db, obj_in=user_in)
        if not user:
            raise AppExc.CreateFailed(obj=User.__name__)
        if settings.EMAILS_ENABLED and user_in.email:
            await db.commit()
            await logger.ainfo(f"Sending email verification email to {user_in.email}")
            await send_email_verification_email(user.id)
        return user

    @staticmethod
    async def get_user(db: AsyncSession, user_id: int) -> User:
        user = await UserCRUD.get(db, user_id)
        if not user:
            raise AppExc.NotFound(obj=User.__name__)
        return user

    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> User:
        user = await UserCRUD.get_by_email(db, email=email)
        if not user:
            raise AppExc.NotFound(obj=User.__name__)
        return user

    @classmethod
    async def update_user(
        cls, db: AsyncSession, user_id: int, user_in: SuperUserUpdate
    ) -> User:
        user = await UserCRUD.get(db, id=user_id)
        if not user:
            raise AppExc.NotFound(obj=User.__name__)
        if user_in.email is not None:
            await cls.is_existing_email_address(db, user_in.email, user)
        user = await UserCRUD.update(db, db_obj=user, obj_in=user_in)
        return user

    @staticmethod
    async def create_user_open(db: AsyncSession, user_in: UserCreate) -> User:
        if not settings.USERS_OPEN_REGISTRATION:
            raise HTTPException(
                status_code=403,
                detail="Open user registration is forbidden on this server",
            )
        user = await UserCRUD.get_by_email(db, email=user_in.email)
        if user:
            raise AppExc.AlreadyExists(
                obj=User.__name__, field="email", value=user_in.email
            )

        user = await UserCRUD.create(db, obj_in=user_in)
        if not user:
            raise AppExc.CreateFailed(obj=User.__name__)
        if settings.EMAILS_ENABLED and user_in.email:
            await db.commit()
            await logger.ainfo(f"Sending welcome email to {user_in.email}")
            await send_email_verification_email(user.id)
        return user

    @classmethod
    async def update_user_me(
        cls, db: AsyncSession, current_user: User, update_data: UserUpdate
    ) -> User:
        # Check if the new email already exists
        if update_data.email is not None:
            await cls.is_existing_email_address(db, update_data.email, current_user)

        current_user_data = jsonable_encoder(current_user, by_alias=False)
        user_in = UserUpdate(**current_user_data)
        user_in = user_in.model_copy(update=update_data.model_dump(exclude_unset=True))
        user = await UserCRUD.update(db, db_obj=current_user, obj_in=user_in)
        return user

    @classmethod
    async def update_password(
        cls, db: AsyncSession, current_user: User, update_data: PasswordUpdate
    ) -> dict[str, str]:
        if current_user.password_hash and not verify_password(
            update_data.old_password.get_secret_value(), current_user.password_hash
        ):
            raise HTTPException(status_code=401, detail="Incorrect existing password")
        password_hash = get_password_hash(update_data.new_password.get_secret_value())
        current_user.password_hash = password_hash
        db.add(current_user)
        return {"msg": "Password updated successfully"}

    @classmethod
    async def reset_password(
        cls, db: AsyncSession, reset_data: PasswordReset
    ) -> dict[str, str]:
        email = verify_password_reset_token(reset_data.token)
        if not email:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired token - Please request a new password reset email",
            )
        user = await cls.get_user_by_email(db, email)
        if not UserCRUD.is_active(user):
            raise HTTPException(status_code=400, detail="Inactive user")
        # Single-use: the token must still match the account's current password
        # hash, so a reset link cannot be replayed after it has been used.
        if not verify_password_reset_token(reset_data.token, user.password_hash):
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired token - Please request a new password reset email",
            )
        password_hash = get_password_hash(reset_data.password.get_secret_value())
        user.password_hash = password_hash
        db.add(user)
        return {"msg": "Password updated successfully"}

    @staticmethod
    async def is_existing_email_address(
        db: AsyncSession, email: EmailStr, user_to_update: User
    ) -> bool:
        """Check if a new email already exists in the database."""
        existing_user = await UserCRUD.get_by_email(db, email)
        if existing_user and existing_user.id != user_to_update.id:
            raise HTTPException(
                status_code=400,
                detail="This email address is already associated with another account.",
            )
        return False

    @classmethod
    async def verify_email(cls, db: AsyncSession, token: str) -> dict[str, str]:
        email = verify_email_verification_token(token)
        if not email:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired token - Please request a new verification email",
            )
        user = await cls.get_user_by_email(db, email)
        if user.email_verified:
            return {"msg": "Email already verified"}
        user.email_verified = True
        db.add(user)
        return {"msg": "Email verified successfully"}

    @classmethod
    async def resend_verification_email(
        cls, db: AsyncSession, email: EmailStr
    ) -> dict[str, str]:
        # Return an identical response whether or not the account exists (and
        # whether or not it is already verified) to avoid account enumeration.
        user = await UserCRUD.get_by_email(db, email=email)
        if user and not user.email_verified:
            await send_email_verification_email(user.id)
        return {
            "msg": "If an account with that email exists and is unverified, "
            "a verification email has been sent - Please check your inbox"
        }

    @classmethod
    async def send_password_reset_email(
        cls, db: AsyncSession, email: EmailStr
    ) -> dict[str, str]:
        # Return an identical response whether or not the account exists to
        # avoid account enumeration.
        user = await UserCRUD.get_by_email(db, email=email)
        if user:
            await send_password_reset_email(email, user.password_hash)
        return {
            "msg": "If an account with that email exists, a password reset "
            "email has been sent - Please check your inbox"
        }
