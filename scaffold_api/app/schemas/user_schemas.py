from pydantic import (
    ConfigDict,
    EmailStr,
    Field,
    SecretStr,
    ValidationInfo,
    field_serializer,
    field_validator,
    model_validator,
)

from app.db.models.user import UserRole
from app.utils import get_first_last_name

from .base_schema import BaseSchema, UrlAdapter


class UserBase(BaseSchema):
    first_name: str | None = None
    last_name: str | None = None
    full_name: str | None = None
    nickname: str | None = None
    image: str | None = None
    locale: str | None = None
    email: EmailStr | None = None

    @field_validator("image", mode="before")
    @classmethod
    def validate_picture(cls, v: str | None) -> str | None:
        if v is not None:
            UrlAdapter.validate_strings(v)
        return v

    def set_first_last_name(self):
        if not self.first_name and not self.last_name and self.full_name:
            self.first_name, self.last_name = get_first_last_name(self.full_name)
        return self

    @model_validator(mode="after")
    def set_dependent_values(self):
        self.set_first_last_name()
        return self


class ProtectedUserBase(UserBase):
    email_verified: bool = False
    active: bool = True
    is_superuser: bool = False
    role: UserRole = "user"


class UserEmail(BaseSchema):
    email: EmailStr


class PasswordMixin(BaseSchema):
    password: SecretStr | None = None

    @field_serializer("password", when_used="json")
    def dump_secret(self, v: SecretStr | None) -> str | None:
        if v is None:
            return None
        return v.get_secret_value()


class UserWithPassword(UserBase, PasswordMixin):
    pass


class SuperUserWithPassword(ProtectedUserBase, PasswordMixin):
    pass


# Properties to receive via API on creation
class UserCreate(UserWithPassword):
    email: EmailStr = Field(default=...)


class SuperUserCreate(SuperUserWithPassword):
    email: EmailStr = Field(default=...)


class UserCreateCredAuth(UserWithPassword):
    email: EmailStr = Field(default=...)
    password: SecretStr = Field(default=...)


# Properties to receive via API on update
class UserUpdate(UserWithPassword):
    password: SecretStr | None = None


class SuperUserUpdate(SuperUserWithPassword):
    password: SecretStr | None = None


class UserInDBBase(ProtectedUserBase):
    id: int | None = None
    model_config = ConfigDict(from_attributes=True)


# Additional properties to return via API
class UserSchema(UserInDBBase):
    pass


# Additional properties stored in DB
class UserInDB(UserInDBBase):
    password_hash: str


class UserInfo(ProtectedUserBase):
    name: str | None = None
    image: str | None = None
    email: EmailStr = Field(default=...)


class UserInfoFAPI(UserInfo):
    id: int = Field(default=..., alias="sub")

    @field_validator("name", mode="after")
    @classmethod
    def set_name_(cls, v: str | None, info: ValidationInfo) -> str | None:
        if v:
            return v
        if full_name := info.data.get("full_name"):
            return full_name
        if (first_name := info.data.get("first_name")) and (
            last_name := info.data.get("last_name")
        ):
            return f"{first_name} {last_name}"
        return v


class UserInfoOAuth(UserInfo):
    first_name: str | None = Field(default=None, alias="given_name")
    last_name: str | None = Field(default=None, alias="family_name")
    image: str | None = Field(default=None, alias="picture")
    email_verified: bool = Field(default=...)

    def set_first_last_name(self):
        if not self.first_name and not self.last_name and self.name:
            self.first_name, self.last_name = get_first_last_name(self.name)
        return self

    @model_validator(mode="after")
    def set_dependent_values(self):
        self.set_first_last_name()
        return self
