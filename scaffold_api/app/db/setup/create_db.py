import logging
from collections.abc import Generator
from contextlib import contextmanager, suppress
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import Engine
from sqlalchemy.engine import URL
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.pool import NullPool
from sqlalchemy_utils.functions import create_database, database_exists, drop_database

from app.db.models.base import Base
from app.db.utils import create_sync_db_engine

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

API_PATH = Path(__file__).parent.parent.parent.parent


@contextmanager
def get_nullpool_sync_engine(db_uri_sync: URL) -> Generator[Engine]:
    engine = create_sync_db_engine(
        db_uri_sync, isolation_level="AUTOCOMMIT", poolclass=NullPool
    )
    yield engine
    engine.dispose()


def create_db(db_uri_sync: URL) -> None:
    logger.info(f"Creating database: {db_uri_sync}")
    create_database(db_uri_sync)
    logger.info(f"Database created: {db_uri_sync}")
    return


def create_tables(db_uri_sync: URL) -> None:
    logger.info("Creating tables metadata")
    db_engine = create_sync_db_engine(db_uri_sync)
    try:
        with db_engine.begin():
            Base.metadata.create_all(db_engine)
    finally:
        db_engine.dispose()
    logger.info("Created tables metadata")
    return


def run_alembic_migrations(db_uri: URL) -> None:
    db_uri_str_pass_hidden = db_uri.render_as_string()
    logger.info(f"Running migrations for dB: {db_uri_str_pass_hidden}")
    alembic_cfg_path = API_PATH / "alembic.ini"
    script_location_path = API_PATH / "app" / "db" / "migrations"

    alembic_cfg = Config(alembic_cfg_path)
    alembic_cfg.attributes["configure_logger"] = False
    alembic_cfg.set_main_option("script_location", str(script_location_path))
    alembic_cfg.set_main_option("sqlalchemy.url", db_uri.render_as_string(False))
    command.upgrade(alembic_cfg, "head")
    logger.info("Migrations completed")


def teardown_db(db_uri_sync: URL) -> None:
    if database_exists(db_uri_sync):
        logger.info(f"Tearing down dB: {db_uri_sync}")
        with suppress(SQLAlchemyError):
            drop_database(db_uri_sync)
        logger.info(f"Tore down dB: {db_uri_sync}")
    return
