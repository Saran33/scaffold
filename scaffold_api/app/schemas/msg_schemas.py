from .base_schema import BaseSchema


class MsgSchema(BaseSchema):
    msg: str


class EmailTokenSchema(BaseSchema):
    token: str
