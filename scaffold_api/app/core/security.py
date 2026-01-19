from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
import structlog
from fastapi import HTTPException, status
from jose import jwt
from jose.exceptions import JWTError

from app.core.config import settings

ALGORITHM = "HS256"

logger = structlog.stdlib.get_logger()


def create_access_token(
    subject: str | Any,
    name: str,
    email: str,
    active: bool,
    iss: str,
    scopes: set[str] | None = None,
    expires_delta: timedelta | None = None,
) -> str:
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    scope = " ".join(scopes) if scopes else ""

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "name": name,
        "email": email,
        "active": active,
        "iss": iss,
        "scope": scope,
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies if the provided plain text password matches the stored hashed password.
    Args:
        plain_password: The plain text password entered by the user.
        hashed_password: The stored hashed password from the database.
    Returns:
        True if the passwords match, False otherwise.
    """
    encoded_hashed_password = hashed_password.encode("utf-8")
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        encoded_hashed_password,
    )


def get_password_hash(password: str) -> str:
    """
    Generates a bcrypt hash for the provided password.
    Args:
        password: The plain text password to hash.
    Returns:
        The generated password hash.
    """
    hashed_bytes = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    return hashed_bytes.decode("utf-8")


def _generate_temp_token(email: str, exp_hrs: float, scope: str) -> str:
    delta = timedelta(hours=exp_hrs)
    now = datetime.now(UTC)
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email, "scope": scope},
        settings.SECRET_KEY,
        algorithm="HS256",
    )
    return encoded_jwt


def _verify_temp_token(token: str, scope: str) -> str | None:
    try:
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        if decoded_token["scope"] != scope:
            return None
        return decoded_token["sub"]
    except JWTError:
        return None


def generate_password_reset_token(email: str) -> str:
    return _generate_temp_token(
        email, settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS, "password_reset"
    )


def verify_password_reset_token(token: str) -> str | None:
    return _verify_temp_token(token, "password_reset")


def generate_email_verification_token(email: str) -> str:
    return _generate_temp_token(
        email, settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS, "email_verification"
    )


def verify_email_verification_token(token: str) -> str | None:
    return _verify_temp_token(token, "email_verification")


def get_rsa_key_from_jwks(jwks: dict[str, Any], token: str) -> dict[str, Any]:
    unverified_header = jwt.get_unverified_header(token)
    rsa_key = {}
    if "kid" not in unverified_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization malformed.",
        )
    for key in jwks["keys"]:
        if key["kid"] == unverified_header["kid"]:
            rsa_key = {
                "kty": key["kty"],
                "kid": key["kid"],
                "use": key["use"],
                "n": key["n"],
                "e": key["e"],
            }
    if not rsa_key:
        logger.error(
            "jwks_key_missing",
            message="Could not find RSA key in JWKS",
            keys=jwks["keys"],
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return rsa_key


def get_unverified_claims(token: str) -> dict[str, Any]:
    return jwt.get_unverified_claims(token)


def get_token_issuer(token: str) -> str | None:
    unverified_claims = jwt.get_unverified_claims(token)
    issuer = unverified_claims.get("iss")
    return issuer
