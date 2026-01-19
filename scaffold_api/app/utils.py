from collections.abc import Callable
from typing import Any, Generic, TypeVar

from pydantic import EmailStr, TypeAdapter
from pydantic_core import ValidationError

T = TypeVar("T", contravariant=True, bound=Any)
R = TypeVar("R", covariant=True)

EmailStrAdapter = TypeAdapter(EmailStr)


class classproperty(Generic[T, R]):
    def __init__(self, func: Callable[[T], R]):
        self.func = func

    def __get__(self, instance=None, cls=None):
        if cls is None:
            raise AttributeError(f"NoneType has no attribute '{self.func}'")
        return self.func(cls)


def get_first_last_name(name: str) -> tuple[str | None, str | None]:
    first_name = None
    last_name = None
    try:
        # in case the 'name' token claim is an email
        EmailStrAdapter.validate_strings(name)
    except ValidationError:
        names = name.split(" ")
        first_name = names[0].strip()
        if len(names) == 2:
            last_name = name.split(" ")[1].strip()
        elif len(names) > 2:
            first_name = " ".join(name.strip() for name in names[:2]).strip()
            last_name = " ".join(name.strip() for name in names[2:]).strip()
    return first_name, last_name
