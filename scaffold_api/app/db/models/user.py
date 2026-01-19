from typing import Literal, get_args

from sqlalchemy import Enum
from sqlalchemy.orm import Mapped, mapped_column

from app.utils import get_first_last_name

from .base import Base, IdMixin, str100, str255

UserRole = Literal["user", "admin"]


class User(IdMixin, Base):
    first_name: Mapped[str100 | None]
    last_name: Mapped[str100 | None] = mapped_column(index=True)
    nickname: Mapped[str100 | None]
    email: Mapped[str255] = mapped_column(unique=True, index=True)
    locale: Mapped[str100 | None]
    image: Mapped[str255 | None]
    password_hash: Mapped[str | None]
    active: Mapped[bool] = mapped_column(default=True)
    email_verified: Mapped[bool] = mapped_column(default=False)
    is_superuser: Mapped[bool] = mapped_column(default=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(
            *get_args(UserRole),
            name="user_role_enum",
            create_constraint=True,
            validate_strings=True,
        ),
        default="user",
        nullable=False,
    )

    @property
    def full_name(self) -> str:
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return ""

    @full_name.setter
    def full_name(self, value: str):
        if value:
            self.first_name, self.last_name = get_first_last_name(value)

    @property
    def username(self) -> str:
        return self.email
