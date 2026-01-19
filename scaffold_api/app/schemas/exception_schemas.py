from typing import Any

from .base_schema import BaseSchema


class AppExecptionSchema(BaseSchema):
    exception: str | None = None
    detail: str | None = None
    context: dict[str, Any] | None = None
