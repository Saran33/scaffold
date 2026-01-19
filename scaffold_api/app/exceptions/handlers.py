import http
from logging import DEBUG

import structlog
from fastapi import Request
from fastapi.exception_handlers import (
    http_exception_handler,
    request_validation_exception_handler,
)
from fastapi.exceptions import RequestValidationError
from reporting.logging import log_level
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.exceptions.base_exc import AppExceptionCase, app_exception_handler

logger = structlog.stdlib.get_logger()


async def custom_validation_exception_handler(
    request: Request, exc: RequestValidationError
):
    if log_level == DEBUG:
        await logger.adebug(
            "validation_error",
            errors=exc.errors(),
            body=exc.body,
        )
    else:
        await logger.ainfo("validation_error", errors=exc.errors())
    return await request_validation_exception_handler(request, exc)


async def http_exception_handler_override(
    request: Request, exc: StarletteHTTPException
):
    await logger.ainfo(
        f"{exc.status_code} {http.HTTPStatus(exc.status_code).phrase}",
        detail=str(exc.detail),
    )
    return await http_exception_handler(request, exc)


async def custom_app_exception_handler(request: Request, exc: AppExceptionCase):
    log_data = {"detail": str(exc.detail), "status_code": exc.status_code}
    if log_level == DEBUG and request.method in ["POST", "PUT", "PATCH"]:
        try:
            body = await request.json()
            log_data["body"] = body
        except Exception as e:
            log_data["body"] = f"Error reading body: {str(e)}"

    await logger.ainfo(
        f"{exc.status_code} {http.HTTPStatus(exc.status_code).phrase}", **log_data
    )
    return await app_exception_handler(request, exc)
