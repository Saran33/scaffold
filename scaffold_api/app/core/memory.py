from collections.abc import AsyncGenerator, Generator
from contextlib import asynccontextmanager, contextmanager

import redis
import redis.asyncio as aioredis
from pydantic import RedisDsn

from app.core.config import settings


class RedisClient:
    """Singleton class for Redis client"""

    _uri: str | None = None
    _instance: redis.Redis | None = None
    _connection_pool: redis.ConnectionPool | None = None

    def __init__(self) -> None:
        """Virtually private constructor."""
        if RedisClient._instance is not None:
            raise Exception("This class is a singleton!")
        RedisClient._uri = str(settings.REDIS_URI)
        RedisClient._connection_pool = redis.ConnectionPool.from_url(
            RedisClient._uri, max_connections=10_000, decode_responses=True
        )
        RedisClient._instance = redis.Redis(
            connection_pool=RedisClient._connection_pool
        )

    @staticmethod
    def client() -> redis.Redis:
        """Static access method."""
        if RedisClient._instance is None:
            RedisClient()
        assert RedisClient._instance
        return RedisClient._instance

    @classmethod
    @contextmanager
    def get_client_ctx(cls) -> Generator[redis.Redis]:
        redis = cls.client()
        try:
            yield redis
        finally:
            redis.close()

    @classmethod
    def get_client(cls) -> Generator[redis.Redis]:
        redis = cls.client()
        try:
            yield redis
        finally:
            redis.close()


class AioRedisClient:
    """Singleton class for aioredis client"""

    _uri: str | None = None
    _instance: aioredis.Redis | None = None
    _connection_pool: aioredis.ConnectionPool | None = None

    def __init__(self) -> None:
        """Virtually private constructor."""
        if AioRedisClient._instance is not None:
            raise Exception("This class is a singleton!")
        AioRedisClient._uri = str(settings.REDIS_URI)
        AioRedisClient._connection_pool = aioredis.ConnectionPool.from_url(
            AioRedisClient._uri, max_connections=10_000, decode_responses=True
        )
        AioRedisClient._instance = aioredis.Redis(
            connection_pool=AioRedisClient._connection_pool,
        )

    @staticmethod
    def client() -> aioredis.Redis:
        """Static access method."""
        if AioRedisClient._instance is None:
            AioRedisClient()
        assert AioRedisClient._instance
        return AioRedisClient._instance

    @classmethod
    @asynccontextmanager
    async def get_client_ctx(cls) -> AsyncGenerator[aioredis.Redis]:
        redis = cls.client()
        try:
            yield redis
        finally:
            await redis.aclose()  # type: ignore

    @classmethod
    async def get_client(cls) -> AsyncGenerator[aioredis.Redis]:
        redis = cls.client()
        try:
            yield redis
        finally:
            await redis.aclose()  # type: ignore


@asynccontextmanager
async def async_task_redis_client(
    uri: RedisDsn | None = None,
) -> AsyncGenerator[aioredis.Redis]:
    """
    Context manager for Redis client in background tasks or separate processes.
    """
    redis_uri = uri or settings.REDIS_URI
    redis_client = aioredis.from_url(
        str(redis_uri), encoding="utf-8", decode_responses=True
    )
    try:
        yield redis_client
    finally:
        await redis_client.aclose()  # type: ignore
