import re
import uuid
from datetime import datetime
from typing import Annotated, Any, Protocol, TypeVar

from sqlalchemy import TIMESTAMP, UUID, String, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    declared_attr,
    mapped_column,
)
from sqlalchemy.schema import MetaData
from sqlalchemy.sql import func

str28 = Annotated[str, 28]
str36 = Annotated[str, 36]
str64 = Annotated[str, 64]
str100 = Annotated[str, 100]
str255 = Annotated[str, 255]


convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}
DeclarativeBase.metadata = MetaData(naming_convention=convention)


class Base(DeclarativeBase):
    created_dt: Mapped[datetime] = mapped_column(
        server_default=func.statement_timestamp()
    )
    updated_dt: Mapped[datetime] = mapped_column(
        server_default=func.statement_timestamp(), onupdate=func.statement_timestamp()
    )

    __mapper_args__ = {"eager_defaults": True}

    @declared_attr.directive
    def __tablename__(cls) -> str:
        # If any base class already has a real table mapped, we’re in an
        # inheritance hierarchy → don’t create another table.
        if any(
            getattr(b, "__table__", None) is not None
            for b in cls.__bases__  # type: ignore[attr-defined]
        ):
            return None  # type: ignore[return-value]
        return re.sub(r"(?<!^)(?=[A-Z])", "_", cls.__name__).lower()

    type_annotation_map = {
        str28: String(28),
        str36: String(32),
        str64: String(64),
        str100: String(100),
        str255: String(255),
        datetime: TIMESTAMP(timezone=True),
        dict[str, Any]: JSONB(none_as_null=True),
        uuid.UUID: UUID(),
    }


PkT = TypeVar("PkT", int, uuid.UUID, str)


class BaseORMProtocol(Protocol[PkT]):
    """Represents our base ORM protocol.
    - It must have an `id` attribute.
    - It must have `created_dt` and `updated_dt` attributes.
    """

    id: Mapped[PkT]
    created_dt: Mapped[datetime]
    updated_dt: Mapped[datetime]


class IdMixin:
    """Mixin for an integer primary key column."""

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, index=True)


class UUIDMixin:
    """Mixin for a UUID primary key column."""

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        index=True,
        server_default=text("gen_random_uuid()"),
    )
