import asyncio
import logging
import os
import pathlib
import sys

from alembic import context
from reporting.logging import handlers
from sqlalchemy import engine_from_config, pool
from sqlalchemy.engine.url import URL
from sqlalchemy.ext.asyncio import create_async_engine

sys.path.append(str(pathlib.Path(__file__).resolve().parents[3]))

from app.core.config import settings
from app.db.models import Base

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
# config reference: https://alembic.sqlalchemy.org/en/latest/api/config.html
config = context.config

# logging configuration originally set in alembic.ini
# but we use our stream hanlers from standard setup to ensure
# errors are sent to stderr and info/warnings to stdout
logging.basicConfig(
    format="%(levelname)-5.5s [%(name)s] %(message)s",
    datefmt="%H:%M:%S",
    level=logging.WARN,
    handlers=handlers,
)
alembic_logger = logging.getLogger("alembic")
alembic_logger.setLevel(logging.INFO)

target_metadata = Base.metadata

compare_server_default = True


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        compare_server_default=compare_server_default,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_server_default=compare_server_default,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode.
    In this scenario we need to create an Engine
    and associate a connection with the context.
    """
    ini_section = config.get_section(config.config_ini_section)
    if not ini_section:
        raise ValueError("No section named 'alembic' in config file")

    connectable = engine_from_config(
        ini_section,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args={"ssl": None},
    )

    with connectable.connect() as connection:
        run_migrations(connection)


async def run_migrations_online_async_engine():
    """Run migrations in 'online' mode when passing an async driver.
    The migrations are still run synchronously.
    In this scenario we need to create an Engine
    and associate a connection with the context.
    """
    db_uri = get_db_uri()
    connectable = create_async_engine(
        db_uri, pool_pre_ping=True, poolclass=pool.NullPool
    )
    async with connectable.connect() as connection:
        await connection.run_sync(run_migrations)


def get_db_uri() -> str | URL:
    if db_uri := (
        # pass a 'db_uri' when calling alembic wihtin a python script if set in the ini
        config.get_main_option("db_uri")
        # pass a db_uri as an x-arg or env variable
        or context.get_x_argument(as_dictionary=True).get("db_uri", os.getenv("DB_URI"))
        # or else use the default sqlalchemy.url from the ini
    ):
        return db_uri
    default_db_uri = settings.DB_URI
    if not default_db_uri:
        raise ValueError(
            "No 'db_uri' found in alembic.ini or passed as an x-arg or in settings"
        )
    return default_db_uri


if context.is_offline_mode():
    run_migrations_offline()
try:
    loop = asyncio.get_running_loop()
    alembic_logger.info("Running migrations with sync DBAPI connection")
    run_migrations_online()
except RuntimeError:
    # No running event loop implies we are passing an async DBAPI connection string.
    # We could update logic to change the DBAPI in the uri passed to alembic,
    # but for now we will simply run the migrations with an async DBAPI.
    alembic_logger.info("Running migrations with async DBAPI connection")
    asyncio.run(run_migrations_online_async_engine())
