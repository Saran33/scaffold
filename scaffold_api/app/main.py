from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import structlog
from fastapi import Request
from fastapi.exceptions import RequestValidationError
from reporting.logging import (
    configure_logger,
    debug_request,
    is_debug,
    set_structlog_request_context,
)
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import Response

from app import API, tasks  # noqa: F401
from app.api.api_v1.api import api_router
from app.core.config import settings
from app.exceptions.base_exc import AppExceptionCase
from app.exceptions.handlers import (
    custom_app_exception_handler,
    custom_validation_exception_handler,
    http_exception_handler_override,
)

configure_logger(json_logs=settings.JSON_LOGS)

logger = structlog.stdlib.get_logger()
IS_DEBUG = is_debug()


@asynccontextmanager
async def lifespan(app: API) -> AsyncIterator[None]:
    """Handle application startup and shutdown events."""
    logger.info("application_startup")
    yield
    logger.info("application_shutdown")


app = API(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.middleware("http")
async def logging_middleware(request: Request, call_next) -> Response:
    set_structlog_request_context(request)
    if IS_DEBUG:
        await debug_request(logger, request)
    response: Response = await call_next(request)
    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return await custom_validation_exception_handler(request, exc)


@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request, exc):
    return await http_exception_handler_override(request, exc)


@app.exception_handler(AppExceptionCase)
async def app_exception_handler(request, exc):
    return await custom_app_exception_handler(request, exc)


app.include_router(api_router, prefix=settings.API_V1_STR)
