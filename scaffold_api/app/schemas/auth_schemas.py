from pydantic import SecretStr

from .base_schema import BaseSchema, OauthBaseSchema


class JWTExchange(BaseSchema):
    token: str


class TokenSchema(OauthBaseSchema):
    access_token: str
    token_type: str


class TokenSecurityPayload(OauthBaseSchema):
    scopes: list[str] = []


class PasswordReset(BaseSchema):
    password: SecretStr
    token: str


class PasswordUpdate(BaseSchema):
    old_password: SecretStr
    new_password: SecretStr
