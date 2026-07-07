import os
import secrets
import tomllib
from enum import StrEnum
from pathlib import Path
from typing import Any, Literal

import structlog
from google.api_core.exceptions import NotFound, PermissionDenied
from google.auth import default as gc_auth_default
from google.cloud.secretmanager import SecretManagerServiceClient
from pydantic import (
    EmailStr,
    PostgresDsn,
    RedisDsn,
    SecretStr,
    ValidationInfo,
    field_validator,
    model_validator,
)
from pydantic.fields import FieldInfo
from pydantic_settings import (
    BaseSettings,
    PydanticBaseSettingsSource,
    SettingsConfigDict,
)
from sqlalchemy import URL
from sqlalchemy.engine.url import make_url

from lib.fields import HttpUrlStr, HttpUrlStrSlash

logger = structlog.stdlib.get_logger()

APP_ENV = os.getenv("APP_ENV")


class AppEnv(StrEnum):
    LOCAL = "local"
    DEV = "dev"
    STAGE = "stage"
    PROD = "prod"

    @classmethod
    def is_valid_env(cls, env: str) -> bool:
        conf = env.split(":")
        return conf[0] in [
            member.name.lower() for member in cls
        ] and AppDeployment.is_valid_deployment(conf[1])


class AppDeployment(StrEnum):
    HOST = "host"
    DOCKER = "docker"
    K8S = "k8s"

    @classmethod
    def is_valid_deployment(cls, deployment: str) -> bool:
        return deployment in [member.name.lower() for member in cls]


class TomlConfigSettingsSource(PydanticBaseSettingsSource):
    def __init__(self, settings_cls: type[BaseSettings], conf: list[str]):
        self.conf = conf
        super().__init__(settings_cls)

    def get_field_value(
        self, field: FieldInfo, field_name: str
    ) -> tuple[Any, str, bool]:
        # Required for current implementation of PydanticBaseSettingsSource.
        raise NotImplementedError

    def __call__(self) -> dict[str, Any]:
        toml_path = (
            Path(__file__).resolve().parents[2]
            / f"configurations/{self.conf[0]}_config.toml"
        )
        config = tomllib.loads(Path(toml_path).read_text(encoding="utf-8"))
        return (
            config["default"] | config.get(self.conf[1])
            if len(self.conf) > 1
            else config["default"]
        )


class GoogleSecretManagerSource(PydanticBaseSettingsSource):
    """
    A settings config source that loads secrets from GSM.
    The active gcloud account must have Secret Accessor permissions.
    """

    class SecretsFormat(StrEnum):
        INDIVIDUAL = "individual"
        TOML = "toml"

    def __init__(self, settings_cls: type[BaseSettings]):
        super().__init__(settings_cls)
        secrets_format = os.getenv("SECRETS_FORMAT", "toml")
        self._secrets_format = self.SecretsFormat(secrets_format)

    def _set_client(self) -> tuple[SecretManagerServiceClient, str]:
        credentials, project_id = gc_auth_default()
        if project_id is None:
            raise ValueError("project_id not found in environment")
        client = SecretManagerServiceClient(credentials=credentials)

        return client, project_id

    def _get_gsm_value(self, field_name: str) -> str | None:
        """
        Call the Google Secret Manager API to get a secret value.
        """
        secret_name = self._client.secret_version_path(
            project=self._project_id, secret=field_name, secret_version="latest"
        )
        response = self._client.access_secret_version(name=secret_name)

        return response.payload.data.decode("UTF-8")

    def get_field_value(
        self, field: FieldInfo | str, field_name: str
    ) -> tuple[Any, str, bool]:
        """
        Get the value of a field from Google Secret Manager.
        """
        field_name = (
            field.alias if isinstance(field, FieldInfo) and field.alias else field_name
        )
        try:
            field_value = self._get_gsm_value(field_name)
        except (NotFound, PermissionDenied) as exc:
            logger.warning("secret_not_found", field_name=field_name, error=str(exc))
            field_value = None

        return field_value, field_name, False

    def _get_toml_secrets_values(self, secret_name: str) -> dict[str, Any]:
        """
        Get multiple values stored in a single secret in TOML format.
        """
        secret_values = self._get_gsm_value(secret_name)
        if not secret_values:
            raise ValueError(f"Secret {secret_name} is empty")

        return tomllib.loads(secret_values)

    def get_toml_secrets(self) -> dict[str, Any]:
        """
        Get multiple secrets stored in a single secret in TOML format.
        """
        secrets: dict[str, Any] = {}
        BACKEND_SECRETS_NAME = os.getenv("BACKEND_SECRETS_NAME")
        if not BACKEND_SECRETS_NAME:
            raise ValueError("BACKEND_SECRETS_NAME is not set")
        fields = self._get_toml_secrets_values(BACKEND_SECRETS_NAME)

        for field_name, field_value in fields.items():
            field = self.settings_cls.model_fields.get(field_name)
            if not field:
                raise ValueError(f"Secret field {field_name} not found")
            prepared_value = self.prepare_field_value(
                field_name, field, field_value, False
            )
            if field_value is not None:
                secrets[field_name] = prepared_value

        return secrets

    def get_individual_secrets(self) -> dict[str, Any]:
        """
        Get all secrets stored individually.
        """
        secrets: dict[str, Any] = {}
        fields = self.settings_cls.model_fields

        for field_name, field in fields.items():
            field_value, field_key, value_is_complex = self.get_field_value(
                field, field_name
            )
            field_value = self.prepare_field_value(
                field_name, field, field_value, value_is_complex
            )
            if field_value is not None:
                secrets[field_key] = field_value

        return secrets

    def __call__(self) -> dict[str, Any]:
        self._client, self._project_id = self._set_client()

        if self._secrets_format == self.SecretsFormat.TOML:
            secrets = self.get_toml_secrets()
        elif self._secrets_format == self.SecretsFormat.INDIVIDUAL:
            secrets = self.get_individual_secrets()
        else:
            raise ValueError(f"SECRETS_FORMAT {self._secrets_format} is not supported")

        return secrets


class ApiSettings(BaseSettings):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    BUSINESS_NAME: str
    BUSINESS_ADDRESS: str

    PROJECT_NAME: str
    API_V1_STR: str
    APP_ENV: str
    ENVIRONMENT: AppEnv
    DEPLOYMENT: AppDeployment
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    HTTPS_SITE: bool
    HTTPS_SERVER: bool
    SITE_HOST: str
    SERVER_HOST: str
    SITE_URL: HttpUrlStr
    SERVER_URL: HttpUrlStr
    # Credentialed CORS (``allow_credentials=True`` in main.py) must never allow
    # the "*" wildcard, so only explicit origins are permitted here.
    BACKEND_CORS_ORIGINS: list[HttpUrlStr]
    TEST_SERVER_HOST: str = "test"

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str] | str:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        if isinstance(v, list | str):
            return v
        raise ValueError(v)

    JSON_LOGS: bool

    SENTRY_DSN: HttpUrlStr | None = None

    POSTGRES_USER: str
    POSTGRES_PASSWORD: SecretStr
    POSTGRES_HOST: str
    POSTGRES_PORT: int
    POSTGRES_DB: str
    DB_URI: URL | None = None

    @field_validator("DB_URI", mode="after")
    def assemble_db_conn(cls, v: str | None, info: ValidationInfo) -> URL:
        if isinstance(v, str):
            return make_url(v)
        password = info.data.get("POSTGRES_PASSWORD")
        if not isinstance(password, SecretStr):
            raise ValueError("REDIS_PASSWORD is not set")

        pg_dsn = PostgresDsn.build(  # pyright: ignore
            scheme="postgresql+asyncpg",
            username=info.data.get("POSTGRES_USER"),
            password=password.get_secret_value(),
            host=info.data.get("POSTGRES_HOST", ""),
            port=info.data.get("POSTGRES_PORT"),
            path=info.data.get("POSTGRES_DB") or "",
        )
        return make_url(str(pg_dsn))

    DB_URI_SYNC: URL | None = None

    @field_validator("DB_URI_SYNC", mode="after")
    def get_db_uri_sync(cls, v: str | None, info: ValidationInfo) -> URL:
        if db_uri := info.data.get("DB_URI"):
            db_uri_str = db_uri.render_as_string(hide_password=False)
            pg_dsn = PostgresDsn(db_uri_str.replace("asyncpg", "psycopg"))  # pyright: ignore
            return make_url(str(pg_dsn))
        raise ValueError("DB_URI is not set")

    REDIS_PASSWORD: SecretStr
    REDIS_HOST: str
    REDIS_PORT: int
    REDIS_DB: int
    REDIS_URI: RedisDsn | None = None

    @field_validator("REDIS_URI", mode="after")
    def assemble_redis_conn(cls, v: str | None, info: ValidationInfo) -> RedisDsn:
        if isinstance(v, str):
            return RedisDsn(v)  # pyright: ignore
        password = info.data.get("REDIS_PASSWORD")
        if not isinstance(password, SecretStr):
            raise ValueError("REDIS_PASSWORD is not set")

        return RedisDsn.build(  # pyright: ignore
            scheme="redis",
            password=password.get_secret_value(),
            host=info.data.get("REDIS_HOST", ""),
            port=info.data.get("REDIS_PORT"),
            path=info.data.get("REDIS_DB") or "",
        )  # pyright: ignore

    SMTP_TLS: bool = True
    SMTP_PORT: int | None = None
    SMTP_HOST: str | None = None
    SMTP_USER: str | None = None
    SMTP_PASSWORD: SecretStr | None = None  # SendGrid API key
    EMAILS_FROM_EMAIL: EmailStr | None = None
    SUPPORT_EMAIL: EmailStr | None = None

    EMAILS_FROM_NAME: str | None = None

    @field_validator("EMAILS_FROM_NAME")
    def get_emails_from_name(cls, v: str | None, info: ValidationInfo) -> str:
        return v or info.data["PROJECT_NAME"].capitalize()

    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 48
    EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS: int = 24
    EMAIL_TEMPLATES_DIR: str = "email-templates/build"
    EMAILS_ENABLED: bool

    @field_validator("EMAILS_ENABLED", mode="before")
    def get_emails_enabled(cls, v: bool | None, info: ValidationInfo) -> bool:
        if v:
            if not bool(
                info.data.get("SMTP_HOST")
                and info.data.get("SMTP_PORT")
                and info.data.get("EMAILS_FROM_EMAIL")
            ):
                raise ValueError(
                    "SMTP_HOST, SMTP_PORT and EMAILS_FROM_EMAIL must be set to enable emails"
                )
            return v
        return False

    FIRST_SUPERUSER: EmailStr
    FIRST_SUPERUSER_PASSWORD: SecretStr
    TEST_USER: EmailStr
    TEST_USER_PASSWORD: str
    UNIT_TEST_USER_EMAIL: EmailStr = "test@example.com"
    UNIT_TEST_USER_PASSWORD: str = "test_password"
    USERS_OPEN_REGISTRATION: bool = False

    AUTH_FLOW: Literal["oauth2", ""] = ""

    AUTH_FAPI_DOMAIN: HttpUrlStr
    AUTH_FAPI_ISSUER: HttpUrlStrSlash

    AUTH_NEXT_DOMAIN: HttpUrlStr
    AUTH_NEXT_ISSUER: HttpUrlStrSlash
    AUTH_NEXT_AUDIENCE: str

    AUTH_DEFAULT_ISS: str
    AUTH_JWKS_TTL_MINS: int = 15
    AUTH_FLOW_ALLOWS_CREDENTIALS: bool = False

    @classmethod
    def validate_app_env(cls, values: dict[str, Any]) -> None:
        if not (env := APP_ENV):
            raise ValueError("APP_ENV is not set")
        if not AppEnv.is_valid_env(env):
            raise ValueError(f"Invalid APP_ENV: {env}")
        conf = env.split(":")
        values["ENVIRONMENT"] = AppEnv(conf[0])
        values["DEPLOYMENT"] = AppDeployment(conf[1])

    @classmethod
    def assemble_site_urls(cls, values: dict[str, Any]) -> None:
        for url_key, scheme_key in zip(
            ("SITE_URL", "SERVER_URL"), ("HTTPS_SITE", "HTTPS_SERVER"), strict=False
        ):
            url: str | None = values.get(url_key)
            if not url or not url.startswith("http"):
                host_key = f"{url_key.split('_')[0]}_HOST"
                host = values.get(host_key)
                if not host:
                    raise ValueError(f"{host_key} is not set")
                scheme = "https" if values.get(scheme_key) else "http"
                values[url_key] = f"{scheme}://{host}"

    @classmethod
    def get_auth_fapi_configs(cls, values: dict[str, Any]) -> None:
        site_url = values.get("SITE_URL")
        api_v1_str = values.get("API_V1_STR")
        if site_url and api_v1_str:
            values["AUTH_FAPI_DOMAIN"] = f"{site_url}{api_v1_str}"
            values["AUTH_FAPI_ISSUER"] = f"{values['AUTH_FAPI_DOMAIN']}/"

    @classmethod
    def get_auth_next_configs(cls, values: dict[str, Any]) -> None:
        site_url = values["SITE_URL"]
        auth_next_domain = values.get("AUTH_NEXT_DOMAIN", "")
        if not auth_next_domain:
            values["AUTH_NEXT_DOMAIN"] = str(site_url)
        if not values.get("AUTH_NEXT_ISSUER"):
            values["AUTH_NEXT_ISSUER"] = f"{str(site_url)}/"
        if not values["AUTH_NEXT_ISSUER"].endswith("/"):
            values["AUTH_NEXT_ISSUER"] += "/"
        values["AUTH_NEXT_AUDIENCE"] = values["AUTH_FAPI_DOMAIN"]

    @classmethod
    def get_default_issuer(cls, values: dict[str, Any]) -> None:
        if not values.get("AUTH_DEFAULT_ISS") and (
            auth_flow := values.get("AUTH_FLOW")
        ):
            if auth_flow != "oauth2":
                raise NotImplementedError(f"AUTH_FLOW {auth_flow} not implemented")
            values["AUTH_DEFAULT_ISS"] = values.get("AUTH_FAPI_ISSUER")

    @classmethod
    def get_is_credentials_auth_allowed(cls, values: dict[str, Any]) -> None:
        if values.get("AUTH_FLOW") in ("oauth2", "oauth2-exch"):
            values["AUTH_FLOW_ALLOWS_CREDENTIALS"] = True

    @classmethod
    def validate_secret_key(cls, values: dict[str, Any]) -> None:
        """Fail fast when ``SECRET_KEY`` is unset in a deployed environment.

        A per-process random key silently breaks token verification across
        replicas and restarts, so only local/test may fall back to one.
        """
        if values.get("SECRET_KEY"):
            return
        environment = values.get("ENVIRONMENT")
        if environment in (AppEnv.DEV, AppEnv.STAGE, AppEnv.PROD):
            raise ValueError(
                "SECRET_KEY must be set in non-local environments; refusing to "
                "boot with an ephemeral, per-process signing key."
            )
        logger.warning("secret_key_ephemeral", environment=str(environment))
        values["SECRET_KEY"] = secrets.token_urlsafe(32)

    GOOGLE_SERVICE_ACCOUNT: str | None = None
    GCP_SERVICE_ACCOUNT_PATH: str | None = None

    IS_TEST: bool = False
    IS_E2E: bool = False

    @model_validator(mode="before")
    @classmethod
    def set_dependent_fields(cls, values: dict[str, Any]):
        cls.validate_app_env(values)
        cls.assemble_site_urls(values)
        cls.get_auth_fapi_configs(values)
        cls.get_auth_next_configs(values)
        cls.get_default_issuer(values)
        cls.get_is_credentials_auth_allowed(values)
        cls.validate_secret_key(values)
        return values

    def get_db_server_uri(self, sync=False) -> URL:
        if not (db_uri := self.DB_URI_SYNC if sync else self.DB_URI):
            raise ValueError(f"DB_URI{'_SYNC' if sync else ''} not set")
        server_uri_str = db_uri.render_as_string(hide_password=False)
        return make_url(server_uri_str.replace(f"/{self.POSTGRES_DB}", ""))

    def get_db_server_uri_str(self, sync=False, hide_password=False) -> str:
        return self.get_db_server_uri(sync).render_as_string(hide_password)

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=str(Path(__file__).parent.parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="forbid",
    )

    @classmethod
    def get_deployment_conf(cls) -> list[str]:
        if env := APP_ENV:
            logger.info("config_settings", APP_ENV=env)
            conf = env.split(":")
            if len(conf) != 2 or not AppEnv.is_valid_env(env):
                raise ValueError(
                    '''APP_ENV inccorect format: should be "ENV:CONFIG"
                    e.g. "local:host", "local:docker" or "local:k8s"'''
                )
            return conf
        raise ValueError("APP_ENV is not set")

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: type[BaseSettings],
        init_settings: PydanticBaseSettingsSource,
        env_settings: PydanticBaseSettingsSource,
        dotenv_settings: PydanticBaseSettingsSource,
        file_secret_settings: PydanticBaseSettingsSource,
    ):
        conf = cls.get_deployment_conf()
        sources = (
            init_settings,
            TomlConfigSettingsSource(settings_cls, conf),
            env_settings,
            dotenv_settings,
            file_secret_settings,
        )
        if conf[0] in ("dev", "stage", "prod"):
            return (*sources, GoogleSecretManagerSource(settings_cls))
        return sources

    def get_namespace(self, prefix: str, remove_prefic: bool = False) -> dict[str, Any]:
        namespace = {}
        for key, value in dict(self).items():
            if key.startswith(prefix):
                if remove_prefic:
                    namespace[key[len(prefix) :]] = value
                else:
                    namespace[key] = value
        return namespace


class TestSettings(ApiSettings):
    def __init__(self, *args, **kwargs):
        logger.info("using_test_settings")
        BaseSettings.__init__(self, *args, **kwargs)

    @classmethod
    def get_auth_next_configs(cls, values: dict[str, Any]) -> None:
        """
        In e2e tests, frontend currently runs locally and backend runs in docker,
        so we need to replace `localhost` with `host.docker.internal`.
        """
        if values.get("IS_E2E"):
            site_host: str = values.get("SITE_HOST", "localhost")
            values["AUTH_NEXT_DOMAIN"] = str(values.get("SITE_URL", "")).replace(
                site_host.split(":")[0], "host.docker.internal"
            )
            # keep the issuer the same as what the Next server signs
            values["AUTH_NEXT_ISSUER"] = f"{values['SITE_URL']}/"
        super().get_auth_next_configs(values)

    @field_validator("POSTGRES_HOST", "REDIS_HOST", mode="before")
    def set_test_host(cls, host: str, info: ValidationInfo) -> str:
        if host and host != "localhost":
            pattern_to_replace = info.data.get("PROJECT_NAME")
            if not isinstance(pattern_to_replace, str):
                raise ValueError("PROJECT_NAME is not set")
            host = host.replace(pattern_to_replace, pattern_to_replace + "_test")
        return host

    @field_validator("POSTGRES_PORT", "REDIS_PORT", mode="before")
    def set_test_port(cls, v: int) -> int:
        if "host" in (APP_ENV or ""):
            return v - 1
        return v


settings = ApiSettings() if not os.getenv("IS_TEST") else TestSettings()
