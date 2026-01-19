from factory.declarations import LazyAttribute, LazyFunction
from factory.faker import Faker

from app.core.security import get_password_hash
from app.db.models import User
from tests.factories.base import BaseFactory
from tests.utils.utils import random_lower_string


def random_password_hash() -> str:
    return get_password_hash(random_lower_string())


class UserFactory(BaseFactory[User]):
    class Meta:
        model = User

    first_name = Faker("first_name")
    last_name = Faker("last_name")
    email = LazyAttribute(
        lambda u: f"{u.first_name.lower()}{u.last_name.lower()}@example.org"
    )
    password_hash = LazyFunction(random_password_hash)
    # items = RelatedFactory(factory=ItemFactory, factory_related_name="owner")

    @classmethod
    def _generate(cls, strategy, params):
        """
        If user passes `email=None`, remove that key so that factory_boy
        does not assign `None` and we fall back to LazyAttribute for email.
        """
        if params.get("email", ...) is None:
            del params["email"]

        return super()._generate(strategy, params)

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """
        Intercept creation to handle optional plain-text password.
        """
        # if "email" in kwargs and kwargs["email"] is None:
        #     kwargs["email"] = random_lower_string() + "@example.org"

        password = kwargs.pop("password", None)
        if password:
            kwargs["password_hash"] = get_password_hash(password)

        return super()._create(model_class, *args, **kwargs)
