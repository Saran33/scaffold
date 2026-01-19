from typing import Any

from app.core.config import settings

SEED_USERS: list[dict[str, Any]] = [
    {
        "first_name": "admin",
        "last_name": "user",
        "nickname": "superuser",
        "email": settings.FIRST_SUPERUSER,
        "password": settings.FIRST_SUPERUSER_PASSWORD.get_secret_value(),
        "active": True,
        "is_superuser": True,
        "role": "admin",
        "email_verified": True,
        "locale": "en_US",
        "image": None,
    },
    {
        "first_name": "test",
        "last_name": "user",
        "nickname": "testuser",
        "email": settings.TEST_USER,
        "password": settings.TEST_USER_PASSWORD,
        "active": True,
        "is_superuser": False,
        "role": "user",
        "email_verified": True,
        "locale": "en_US",
        "image": None,
    },
]
