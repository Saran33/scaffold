import json
from collections.abc import AsyncIterator, Callable
from typing import Any

import dill as pickle

from app.core.memory import AioRedisClient

Serializer = Callable[[Any], str | bytes]
Deserializer = Callable[[str | bytes | bytearray], Any]


class Cache:
    """Redis cache wrapper"""

    def __init__(self, client=None):
        self.client = client or AioRedisClient.client()

    async def get(self, key: str, deserializer: Deserializer = json.loads) -> Any:
        if deserializer not in {json.loads, pickle.loads}:
            raise ValueError("Invalid deserializer function")
        value = await self.client.get(key)
        return deserializer(value) if value else None

    async def set(
        self,
        key: str,
        value: Any,
        exp: int = 3_600,
        serializer: Serializer = json.dumps,
    ) -> bool | None:
        if serializer not in {json.dumps, pickle.dumps}:
            raise ValueError("Invalid serializer function")
        return await self.client.set(key, serializer(value), ex=exp)

    async def delete(self, key: str) -> int:
        return await self.client.delete(key)

    async def exists(self, key: str) -> bool:
        n_matching_keys = await self.client.exists(key)
        if n_matching_keys > 1:
            raise ValueError(f"Multiple keys found for {key}")
        return n_matching_keys == 1

    async def keys(self, pattern: str) -> list[str]:
        return await self.client.keys(pattern)

    async def flush(self) -> None:
        await self.client.flushall()

    async def get_length(self) -> int:
        return len(await self.client.keys())

    async def contains(self, key: str) -> bool:
        return await self.exists(key)

    async def iter_keys(self) -> AsyncIterator[str]:
        keys = await self.client.keys()
        for key in keys:
            yield key

    async def iter_keys_reversed(self) -> AsyncIterator[str]:
        keys = await self.client.keys()
        for key in reversed(keys):
            yield key

    def __repr__(self) -> str:
        return f"Cache({self.client})"

    def __str__(self) -> str:
        return f"Cache({self.client})"

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Cache):
            raise NotImplementedError
        return self.client == other.client

    def __ne__(self, other: object) -> bool:
        if not isinstance(other, Cache):
            raise NotImplementedError
        return self.client != other.client


cache = Cache()
