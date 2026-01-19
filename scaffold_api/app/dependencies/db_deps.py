from collections.abc import AsyncIterator, Generator
from contextlib import contextmanager
from typing import Annotated

import redis.asyncio as aioredis
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy.orm import Session

from app.core.memory import AioRedisClient
from app.db.session import AsyncSessionLocal, SessionLocal


def get_db() -> Generator[Session]:
    session: Session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


db_context = contextmanager(get_db)


async def get_db_async() -> AsyncIterator[async_sessionmaker[AsyncSession]]:
    yield AsyncSessionLocal


AsyncSessionMaker = Annotated[async_sessionmaker[AsyncSession], Depends(get_db_async)]


AsyncRedisClient = Annotated[aioredis.Redis, Depends(AioRedisClient.get_client)]
