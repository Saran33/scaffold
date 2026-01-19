from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import (
    AfterValidator,
    AnyHttpUrl,
    AnyUrl,
    PlainSerializer,
    PlainValidator,
    TypeAdapter,
    UrlConstraints,
    WithJsonSchema,
)
from pydantic_core import PydanticCustomError

from lib.date_utils import to_iso_with_z_suffix, to_utc


def validate_dt_aware(value: str | datetime | None):
    if isinstance(value, str):
        # deserialize from string to datetime
        dt = datetime.fromisoformat(value)
        if dt.tzinfo is None:
            raise PydanticCustomError(
                "DateTimeAware", "Datetime object must be timezone-aware"
            )
        return to_utc(dt)
    if isinstance(value, datetime):
        # serialize from datetime to string
        if value.tzinfo is None:
            raise PydanticCustomError(
                "DateTimeAware", "Datetime object must be timezone-aware"
            )
        return value
    if value is None:
        return None
    raise PydanticCustomError("DateTimeAware", "Invalid value for datetime")


DateTimeAware = Annotated[
    datetime | str,
    PlainSerializer(
        lambda v: to_iso_with_z_suffix(v), return_type=str, when_used="json"
    ),
    PlainValidator(validate_dt_aware),
    WithJsonSchema({"type": "string", "format": "iso8601"}),
]


AnyHttpUrlAdapter = TypeAdapter(AnyHttpUrl)

HttpUrlStr = Annotated[
    str,
    PlainValidator(lambda x: AnyHttpUrlAdapter.validate_strings(x)),
    AfterValidator(lambda x: str(x).rstrip("/")),
]

HttpUrlStrSlash = Annotated[
    str,
    PlainValidator(lambda x: AnyHttpUrlAdapter.validate_strings(x)),
    AfterValidator(lambda x: str(x)),
]


class HttpsUrl(AnyUrl):
    _constraints = UrlConstraints(max_length=2083, allowed_schemes=["https"])


HttpsUrlAdapter = TypeAdapter(HttpsUrl)

HttpsUrlStr = Annotated[
    str,
    PlainValidator(lambda x: HttpsUrlAdapter.validate_strings(x)),
    AfterValidator(lambda x: str(x).rstrip("/")),
]


def serialize_decimal_normalized_str(v: Decimal) -> str:
    """Serialize Decimal to a normalized string representation."""
    return str(v.normalize())


NormalizedDecimal = Annotated[
    Decimal,
    PlainSerializer(
        serialize_decimal_normalized_str, return_type=str, when_used="json"
    ),
]


def format_cents(cents: int, currency: str) -> str:
    """Format cents to currency display string."""
    amount = cents / 100
    if currency.lower() == "eur":
        return f"€{amount:.2f}"
    if currency.lower() == "usd":
        return f"${amount:.2f}"
    if currency.lower() == "gbp":
        return f"£{amount:.2f}"
    return f"{amount:.2f} {currency.upper()}"
