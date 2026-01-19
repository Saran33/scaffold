import logging
import os
import uuid
from collections.abc import Callable, Iterator, Mapping, MutableMapping
from contextlib import contextmanager
from logging import StreamHandler
from typing import Any, TextIO

import structlog
from starlette.requests import Request
from uvicorn.config import LOG_LEVELS

log_level_str = os.getenv("LOG_LEVEL", "info").lower()
log_level = LOG_LEVELS.get(log_level_str, logging.INFO)

ProcessorType = Callable[[Any, str, MutableMapping[str, Any]], Mapping[str, Any]]


class MessageIsNormal(logging.Filter):
    def filter(self, record):
        return record.levelno < logging.ERROR


# logs INFO and WARNING to stdout
std_out = logging.StreamHandler()
std_out.setLevel(logging.DEBUG)
std_out.addFilter(MessageIsNormal())

# logs ERROR and CRITICAL to stderr
std_err = logging.StreamHandler()
std_err.setLevel(logging.ERROR)

handlers = [std_out, std_err]

info_level_modules = ["multipart", "python_multipart"]


def configure_logger(
    json_logs: bool = False, handlers: list[StreamHandler[TextIO]] = handlers
):
    timestamper = structlog.processors.TimeStamper(fmt="%Y-%m-%d %H:%M:%S")

    logger = structlog.stdlib.get_logger()
    logger.info(
        "logging_configured",
        log_level=log_level_str.upper(),
        json_logs=json_logs,
        py_level=log_level,
    )

    shared_processors: list[ProcessorType] = [
        timestamper,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.contextvars.merge_contextvars,
        structlog.processors.CallsiteParameterAdder(
            {
                structlog.processors.CallsiteParameter.PATHNAME,
                structlog.processors.CallsiteParameter.FILENAME,
                structlog.processors.CallsiteParameter.MODULE,
                structlog.processors.CallsiteParameter.FUNC_NAME,
                structlog.processors.CallsiteParameter.THREAD,
                structlog.processors.CallsiteParameter.THREAD_NAME,
                structlog.processors.CallsiteParameter.PROCESS,
                structlog.processors.CallsiteParameter.PROCESS_NAME,
            }
        ),
        structlog.stdlib.ExtraAdder(),
    ]

    structlog.configure(
        processors=shared_processors
        + [structlog.stdlib.ProcessorFormatter.wrap_for_formatter],
        logger_factory=structlog.stdlib.LoggerFactory(),
        # call log with await syntax in thread pool executor
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    logs_render = (
        structlog.processors.JSONRenderer()
        if json_logs
        else structlog.dev.ConsoleRenderer(colors=True)
    )

    _configure_default_logging_by_custom(shared_processors, logs_render, handlers)


def _configure_default_logging_by_custom(
    shared_processors, logs_render, handlers: list[StreamHandler[TextIO]]
):
    logging.basicConfig(format="%(message)s", level=log_level, handlers=handlers)

    if log_level == logging.DEBUG:
        # suppress DEBUG logs for some modules if log level is DEBUG
        for module in info_level_modules:
            logging.getLogger(module).setLevel(logging.INFO)

    # Use `ProcessorFormatter` to format all `logging` entries.
    formatter = structlog.stdlib.ProcessorFormatter(
        foreign_pre_chain=shared_processors,
        processors=[
            _extract_from_record,
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            logs_render,
        ],
    )

    for handler in handlers:
        handler.setFormatter(formatter)


def _extract_from_record(_, __, event_dict):
    # Extract thread and process names and add them to the event dict.
    record = event_dict["_record"]
    event_dict["thread_name"] = record.threadName
    event_dict["process_name"] = record.processName
    return event_dict


def set_structlog_request_context(request: Request) -> None:
    """Set request context for structlog."""
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(
        method=request.method,
        request_path=request.url.path,
        request_client=str(request.client),
        request_user_agent=request.headers.get("User-Agent", None),
        request_id=request.headers.get("X-Request-ID", str(uuid.uuid4())),
    )


@contextmanager
def structlog_contextvars_context(
    context_to_keep: tuple[str, ...] | str = "",
) -> Iterator[dict[str, Any]]:
    """Set fresh context for the duration of a context scope."""
    context = structlog.contextvars.get_contextvars().copy()

    relevant_context = (
        {k: v for k, v in context.items() if k in context_to_keep}
        if context_to_keep
        else {}
    )
    structlog.contextvars.clear_contextvars()
    try:
        yield relevant_context
    finally:
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(**context)


@contextmanager
def structlog_add_context(context: dict[str, Any]):
    old_context = structlog.contextvars.get_contextvars().copy()
    try:
        structlog.contextvars.bind_contextvars(**context)
        yield
    finally:
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(**old_context)


def is_debug() -> bool:
    """Check if log level is set to DEBUG."""
    return log_level == logging.DEBUG


EXCLUDE_DEBUG_HEADERS = [
    "authorization",
    "x-api-key",
    "accept",
    "accept-encoding",
    "accept-language",
    "content-length",
    "connection",
]


async def debug_request(logger: structlog.stdlib.BoundLogger, request: Request) -> None:
    """Log request details."""
    body = None
    if request.method in ["POST", "PUT", "PATCH"]:
        try:
            body = await request.json()
        except Exception as e:
            body = f"Error reading body: {str(e)}"
    headers_to_log = {
        k: v for k, v in request.headers.items() if k not in EXCLUDE_DEBUG_HEADERS
    }
    await logger.adebug(
        "debug_request",
        method=request.method,
        url=request.url,
        body=body,
        headers=headers_to_log,
    )
