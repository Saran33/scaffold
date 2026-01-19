import asyncio
from collections.abc import AsyncGenerator, AsyncIterator, Generator
from contextlib import (
    asynccontextmanager,
)
from typing import Any

import pytest
import pytest_asyncio
import redis.asyncio as aioredis
from httpx import ASGITransport
from httpx import AsyncClient as AsyncTestClient
from pytest import MonkeyPatch
from sqlalchemy import event
from sqlalchemy.ext.asyncio import (
    AsyncConnection,
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
)
from sqlalchemy.orm import Session, SessionTransaction

from app.core.config import settings
from app.core.memory import AioRedisClient
from app.db import session as session_module
from app.db.setup.create_db import (
    teardown_db,
)
from app.db.setup.init_db import init_db
from app.db.utils import get_async_engine
from app.dependencies.db_deps import get_db_async
from app.main import app
from app.tasks import order_tasks, user_tasks
from tests import factories
from tests.factories.base import set_factories_session
from tests.utils.db import get_db_name
from tests.utils.user import (
    random_lower_string,
)
from tests.utils.vcr_utils import (
    filter_ai_provider_headers,
    query_without_token,
)

pytest_plugins = [
    "tests.fixtures.user_fixtures",
    "tests.fixtures.payments_fixtures",
]


@pytest.fixture(scope="session")
def db_name(worker_id: str) -> str:
    return get_db_name(worker_id)


@pytest_asyncio.fixture
async def async_engine(db_name: str) -> AsyncGenerator[AsyncEngine]:
    test_db_uri = f"{settings.get_db_server_uri_str()}/{db_name}"
    async for async_engine in get_async_engine(test_db_uri):
        yield async_engine


@pytest_asyncio.fixture
async def conn(async_engine: AsyncEngine) -> AsyncGenerator[AsyncConnection]:
    """
    SQLALchemy connection with a savepoint to allow commits within tests
    (if using the connection to execute SQL) but still rollback at the end.
    """
    async with async_engine.connect() as conn:
        trans = await conn.begin()
        savepoint = await conn.begin_nested()
        yield conn
        await savepoint.rollback()
        await trans.rollback()


@pytest_asyncio.fixture
async def db(conn: AsyncConnection) -> AsyncGenerator[AsyncSession]:
    """
    SQLALchemy session with savepoints after each commit/rollback
    to allow commits within tests but still rollback at the end.
    Also sets up a test session dependency override for the app.
    """
    AsyncSessionLocal = async_sessionmaker(
        bind=conn, autocommit=False, autoflush=False, expire_on_commit=False
    )
    async with AsyncSessionLocal() as session:
        await session.begin_nested()

        @event.listens_for(session.sync_session, "after_transaction_end")
        def restart_savepoint(session: Session, transaction: SessionTransaction):
            if transaction.nested and not (
                transaction._parent and transaction._parent.nested
            ):
                session.begin_nested()

        async def get_test_session() -> AsyncIterator[async_sessionmaker]:
            yield AsyncSessionLocal

        app.dependency_overrides[get_db_async] = get_test_session

        yield session


@pytest.fixture(scope="session", autouse=True)
def setup_test_db(db_name: str) -> Generator:
    asyncio.run(init_db(db_name, use_alembic=True))
    yield
    teardown_db(settings.get_db_server_uri(sync=True))


@pytest.fixture(autouse=True)
def _setup_factories(db: AsyncSession) -> None:
    set_factories_session(db, factories)


@pytest_asyncio.fixture(autouse=True)
async def patch_async_task_db_session(monkeypatch: MonkeyPatch, db: AsyncSession):
    """
    Automatically patches 'app.db.session.async_task_db_session' for all tests.
    This ensures tasks use the same transaction and are rolled back.
    """

    @asynccontextmanager
    async def mocked_async_task_db_session(*, begin=False, db_uri=None):
        """
        Yields the existing 'db' fixture session, ignoring 'begin' and 'db_uri' because
        the 'db' fixture already handles the lifecycle and uses the test db connection.
        """
        yield db

    modules_to_patch = [
        session_module,
        user_tasks,
        order_tasks,
    ]
    for module in modules_to_patch:
        monkeypatch.setattr(
            module,
            "async_task_db_session",
            mocked_async_task_db_session,
        )


@pytest_asyncio.fixture(autouse=True)
async def patch_get_async_db_session(monkeypatch: MonkeyPatch, db: AsyncSession):
    """
    Patches 'app.db.session.get_async_db_session' for all tests.
    """

    @asynccontextmanager
    async def mocked_get_async_db_session(*, begin=False):
        """
        Yields the existing 'db' fixture session.
        """
        yield db

    modules_to_patch = [session_module]
    for module in modules_to_patch:
        monkeypatch.setattr(
            module,
            "get_async_db_session",
            mocked_get_async_db_session,
        )


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncTestClient]:
    """Client for v1 API tests. If adding v2, create a new client fixture."""
    async with AsyncTestClient(
        transport=ASGITransport(app=app),
        base_url=f"https://{settings.TEST_SERVER_HOST}{settings.API_V1_STR}",
    ) as client:
        yield client


@pytest.fixture(scope="module")
def vcr_config():
    def before_record_cb(response: dict[str, Any]):
        return filter_ai_provider_headers(response)

    return {
        "filter_headers": [
            ("x-api-key", "DUMMY"),
            ("authorization", "DUMMY"),
        ],
        "filter_query_parameters": [
            ("api_key", "DUMMY"),
            ("client_secret", "DUMMY"),
        ],
        "filter_post_data_parameters": [
            ("previewToken", "DUMMY"),
            ("client_secret", "DUMMY"),
            ("refresh_token", "DUMMY"),
        ],
        "ignore_localhost": False,
        "ignore_hosts": [
            settings.TEST_SERVER_HOST,
        ],
        "record_mode": "once",  # delete cassettes or change to "all" to record new cassettes
        "before_record_response": before_record_cb,
    }


def pytest_recording_configure(config, vcr):
    """Configure custom VCR matchers for pytest-recording."""
    vcr.register_matcher("query_without_token", query_without_token)


@pytest.fixture
def random_str() -> str:
    return random_lower_string()


@pytest.fixture(scope="session", autouse=True)
def redis_db(worker_id: str) -> Generator[int]:
    # Map worker_id to a unique Redis database number
    db_num = 0 if worker_id == "master" else int(worker_id.replace("gw", ""))
    yield db_num


@pytest_asyncio.fixture(autouse=True)
async def redis(redis_db: int) -> AsyncGenerator[aioredis.Redis]:
    redis = aioredis.from_url(
        f"{str(settings.REDIS_URI)}{str(redis_db)}",
        encoding="utf-8",
        decode_responses=True,
    )

    async def get_redis_client() -> AsyncIterator[aioredis.Redis]:
        yield redis

    app.dependency_overrides[AioRedisClient.get_client] = get_redis_client

    yield redis
    await redis.flushdb()
    await redis.aclose()  # type: ignore
