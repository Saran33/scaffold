from factory.faker import Faker

from .user import UserFactory

Faker._DEFAULT_LOCALE = "en_US"


__all__ = ("UserFactory",)
