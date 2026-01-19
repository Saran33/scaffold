from typing import Any

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    HttpUrl,
    TypeAdapter,
)
from pydantic.alias_generators import to_camel


class BaseSchema(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


class BaseSchemaByAlias(BaseSchema):
    def model_dump(self, **kwargs) -> dict[str, Any]:
        return super().model_dump(by_alias=True, **kwargs)


class OauthBaseSchema(BaseModel):
    """OAuth 2.0 and OIDC use snake_case
    as per https://www.rfc-editor.org/rfc/rfc6749"""


UrlAdapter = TypeAdapter(HttpUrl)  # pyright: ignore
EmailAdapter = TypeAdapter(EmailStr)  # pyright: ignore
