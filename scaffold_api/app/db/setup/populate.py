# make sure all SQL Alchemy models are imported (app.db.base) before initializing DB
# otherwise, SQL Alchemy might fail to initialize relationships properly
# for more details: https://github.com/tiangolo/full-stack-fastapi-postgresql/issues/28

import logging

from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

import app.db.models  # noqa: F401
from app import schemas
from app.db.crud import (
    UserCRUD,
)
from app.db.setup.seed_data.seed_users import SEED_USERS

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


async def create_users(db: AsyncSession) -> None:
    for user_data in SEED_USERS:
        if not user_data["password"]:
            raise ValueError(f"Password is required for user: {user_data['email']}")
        user = await UserCRUD.get_by_email(db, email=user_data["email"])

        if not user:
            user_in = schemas.SuperUserCreate(**user_data)
            role = "superuser" if user_in.is_superuser else "user"
            logger.info(f"Creating {role}: {user_in.email}")
            user = await UserCRUD.create(db, obj_in=user_in)


async def init_db_data(db: AsyncSession) -> None:
    logger.info("Creating initial data")
    async with db.begin():
        await create_users(db)
    logger.info("Initial data created")
