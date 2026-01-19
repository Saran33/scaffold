import asyncio
import logging

from sqlalchemy import URL
from sqlalchemy.engine.url import make_url
from sqlalchemy.ext.asyncio import (
    async_sessionmaker,
)

from app.core.config import settings
from app.db.setup.create_db import (
    create_db,
    create_tables,
    get_nullpool_sync_engine,
    run_alembic_migrations,
    teardown_db,
)
from app.db.setup.populate import init_db_data
from app.db.utils import get_async_engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("init_db")


async def populate_db(db_uri_async: URL) -> None:
    async for async_engine in get_async_engine(db_uri_async):
        async with async_sessionmaker(
            bind=async_engine, autocommit=False, autoflush=False, expire_on_commit=False
        )() as async_session:
            await init_db_data(async_session)


async def init_db(db_name: str, use_alembic: bool = False) -> None:
    """
    (Re)creates the database, tables, and populates the tables with seed data.
    """
    DB_SERVER_URI_SYNC = settings.get_db_server_uri(sync=True)
    logger.info(f"Initializing database: {DB_SERVER_URI_SYNC.render_as_string()}")
    with get_nullpool_sync_engine(DB_SERVER_URI_SYNC) as sync_engine:
        db_uri = make_url(f"{DB_SERVER_URI_SYNC.render_as_string(False)}/{db_name}")
        db_uri_async = make_url(f"{settings.get_db_server_uri_str()}/{db_name}")

        teardown_db(db_uri)
        create_db(db_uri)

        if use_alembic:
            run_alembic_migrations(db_uri)
        else:
            create_tables(db_uri, sync_engine)

        await populate_db(db_uri_async)


async def main() -> None:
    await init_db(settings.POSTGRES_DB, use_alembic=True)


if __name__ == "__main__":
    asyncio.run(main())
