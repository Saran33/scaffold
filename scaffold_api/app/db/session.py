from contextlib import asynccontextmanager
from typing import TYPE_CHECKING

from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.db.utils import create_async_db_engine, create_sync_db_engine, get_async_engine

if TYPE_CHECKING:
    if not settings.DB_URI_SYNC or not settings.DB_URI:
        raise ValueError("DB_URI_SYNC and DB_URI must be set in the environment")

DB_URI_SYNC = settings.DB_URI_SYNC
DB_URI = settings.DB_URI

sync_engine = create_sync_db_engine(DB_URI_SYNC)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)


async_engine = create_async_db_engine(DB_URI, echo=False)
# echo_pool="debug"

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    # autobegin=False,
)


@asynccontextmanager
async def async_task_db_session(*, begin=False, db_uri: str | None = None):
    """Provide a transactional scope when running in a new event loop in a background task."""
    uri = db_uri if db_uri is not None else DB_URI
    async for async_engine in get_async_engine(uri):
        AsyncSessionLocal = async_sessionmaker(
            async_engine, autocommit=False, autoflush=False, expire_on_commit=False
        )
        if begin:
            async with AsyncSessionLocal.begin() as session:
                yield session
        else:
            async with AsyncSessionLocal() as session:
                yield session


@asynccontextmanager
async def get_async_db_session(*, begin=False):
    """Get a database session using the existing sessionmaker."""
    if begin:
        async with AsyncSessionLocal.begin() as session:
            yield session
    else:
        async with AsyncSessionLocal() as session:
            yield session
