import asyncio
import logging
import os
import sys

from sqlalchemy import URL
from sqlalchemy.engine.url import make_url
from sqlalchemy.ext.asyncio import (
    async_sessionmaker,
)

from app.core.config import AppEnv, settings
from app.db.setup.create_db import (
    create_db,
    create_tables,
    run_alembic_migrations,
    teardown_db,
)
from app.db.setup.populate import init_db_data
from app.db.utils import get_async_engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("init_db")

FORCE_INIT_ENV_FLAG = "FORCE_DB_INIT"


def _guard_destructive_init(db_uri: URL) -> None:
    """Guard against accidentally destroying a non-local database.

    ``init_db`` drops and recreates the target database, which is
    irreversible. Refuse to run against a deployed environment unless the
    operator explicitly opts in via ``FORCE_DB_INIT``, and require an
    interactive confirmation whenever attached to a terminal.
    """
    is_forced = os.getenv(FORCE_INIT_ENV_FLAG, "").strip().lower() in (
        "1",
        "true",
        "yes",
    )
    if settings.ENVIRONMENT != AppEnv.LOCAL and not is_forced:
        raise RuntimeError(
            f"Refusing to (re)initialise database '{db_uri.database}' in "
            f"environment '{settings.ENVIRONMENT}': this DROPS ALL DATA. "
            f"Set {FORCE_INIT_ENV_FLAG}=true to override."
        )
    if sys.stdin.isatty() and not is_forced:
        answer = input(
            f"⚠️  This will DROP and recreate database '{db_uri.database}' and "
            f"destroy all its data. Type 'yes' to continue: "
        )
        if answer.strip().lower() != "yes":
            raise SystemExit("Database initialisation cancelled.")


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
    db_uri = make_url(f"{DB_SERVER_URI_SYNC.render_as_string(False)}/{db_name}")
    db_uri_async = make_url(f"{settings.get_db_server_uri_str()}/{db_name}")

    _guard_destructive_init(db_uri)

    teardown_db(db_uri)
    create_db(db_uri)

    if use_alembic:
        run_alembic_migrations(db_uri)
    else:
        create_tables(db_uri)

    await populate_db(db_uri_async)


async def main() -> None:
    await init_db(settings.POSTGRES_DB, use_alembic=True)


if __name__ == "__main__":
    asyncio.run(main())
