from collections.abc import AsyncGenerator, Callable
from datetime import date, datetime, time
from decimal import Decimal
from typing import Any

import orjson
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from sqlalchemy import URL, create_engine, inspect
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.ext.hybrid import hybrid_property

from app.db.models import Base


def orjson_serializer(obj):
    """
    Note that `orjson.dumps()` return byte array, while sqlalchemy expects string, thus `decode()` call.
    """

    def default(obj):
        if isinstance(obj, Decimal):
            return str(obj)
        raise TypeError

    return orjson.dumps(
        obj, option=orjson.OPT_SERIALIZE_NUMPY | orjson.OPT_NAIVE_UTC, default=default
    ).decode()


def create_async_db_engine(db_uri: str | URL, **kwargs):
    return create_async_engine(
        db_uri,
        pool_pre_ping=True,
        json_serializer=orjson_serializer,
        json_deserializer=orjson.loads,
        **kwargs,
    )


def create_sync_db_engine(db_uri: str | URL, **kwargs):
    return create_engine(
        db_uri,
        pool_pre_ping=True,
        json_serializer=orjson_serializer,
        json_deserializer=orjson.loads,
        **kwargs,
    )


async def get_async_engine(db_uri: str | URL, **kwargs) -> AsyncGenerator[AsyncEngine]:
    async_engine = create_async_db_engine(db_uri, **kwargs)
    try:
        yield async_engine
    finally:
        await async_engine.dispose()


def get_model_attr_names(model: Base) -> set[str]:
    """
    Returns a set of names of all columns and hybrid properties of a SQLAlchemy model.

    Args:
        model (Base): An instance of a SQLAlchemy model.

    Returns:
        set[str]: A set of names of all columns and hybrid properties of the model.
    """
    insp_class = inspect(model.__class__)
    assert insp_class is not None, "insp_class should not be None"
    columns = {column.key for column in insp_class.attrs}
    hybrid_props = {
        str(desc.__name__)
        for desc in insp_class.all_orm_descriptors
        if isinstance(desc, hybrid_property)
    }
    return columns.union(hybrid_props)


_DATETIME_PASSTHROUGH: dict[type, Callable[[Any], Any]] = {
    datetime: lambda v: v,
    date: lambda v: v,
    time: lambda v: v,
    Decimal: lambda v: v,  # Keep Decimal objects intact for SQLAlchemy
}


def db_jsonable_encoder(obj: Any, **kwargs) -> Any:
    """
    JSON-encodes anything like FastAPI's helper **but** keeps datetime/date/time
    instances as Python objects so they can be passed straight to SQLAlchemy.
    """
    # 1. If we are given a Pydantic model, dump it in *python* mode first –
    #    this keeps datetime objects intact.
    if isinstance(obj, BaseModel):
        # Pull the standard jsonable_encoder kwargs that have the same names as
        # Pydantic's model_dump() and pass them through.
        obj = obj.model_dump(
            mode="python",
            include=kwargs.get("include"),
            exclude=kwargs.get("exclude"),
            by_alias=kwargs.get("by_alias", True),
            exclude_unset=kwargs.get("exclude_unset", False),
            exclude_defaults=kwargs.get("exclude_defaults", False),
            exclude_none=kwargs.get("exclude_none", False),
        )

    # 2. Now run FastAPI’s jsonable_encoder with our pass-through for dt objects.
    custom_encoder = {**_DATETIME_PASSTHROUGH, **kwargs.pop("custom_encoder", {})}
    return jsonable_encoder(obj, custom_encoder=custom_encoder, **kwargs)
