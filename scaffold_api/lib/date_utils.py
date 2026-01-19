from datetime import UTC, datetime


def to_iso_with_z_suffix(dt: datetime) -> str:
    return dt.isoformat().replace("+00:00", "Z")


def to_utc(dt: datetime) -> datetime:
    return dt.astimezone(UTC)


def timestamp_to_utc(stamp: int) -> datetime:
    return to_utc(datetime.fromtimestamp(stamp, tz=UTC))
