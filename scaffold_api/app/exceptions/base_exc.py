from typing import Any

from fastapi import Request, status
from fastapi.utils import is_body_allowed_for_status_code
from pydantic import BaseModel
from starlette.responses import JSONResponse, Response


class AppExceptionCase(Exception):
    def __init__(
        self,
        status_code: int,
        detail: str,
        context: BaseModel | dict[str, Any] | None = None,
        headers: dict[str, Any] | None = None,
    ):
        self.case = self.__class__.__name__
        self.status_code = status_code
        self.headers = headers
        self.detail = detail
        self.context = context or ""

    def __str__(self) -> str:
        return (
            f"<AppException {self.case} - "
            f"status_code={self.status_code} | detail={self.detail} | context={self.context}>"
        )

    def __repr__(self) -> str:
        return f"{self.case}(status_code={self.status_code!r}, detail={self.detail!r})"


async def app_exception_handler(request: Request, exc: AppExceptionCase) -> Response:
    if not is_body_allowed_for_status_code(exc.status_code):
        return Response(status_code=exc.status_code, headers=exc.headers)
    context_dict = (
        exc.context.model_dump(mode="json")
        if isinstance(exc.context, BaseModel)
        else exc.context
    )
    return JSONResponse(
        status_code=exc.status_code,
        headers=exc.headers,
        content={
            "exception": exc.case,
            "detail": exc.detail,
            "context": context_dict,
        },
    )


class AppExcContext(BaseModel):
    obj: str
    field: str | None = None
    value: str | None = None


class AppExc:
    class CreateFailed(AppExceptionCase):
        def __init__(self, obj: str = "object"):
            """
            obj creation failed
            """
            self.context = AppExcContext(obj=obj)
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            detail = f"{obj} creation failed"
            super().__init__(status_code, detail)

    class UpdateFailed(AppExceptionCase):
        def __init__(self, obj: str = "object"):
            """
            obj update failed
            """
            self.context = AppExcContext(obj=obj)
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            detail = f"{obj} update failed"
            super().__init__(status_code, detail)

    class DeleteFailed(AppExceptionCase):
        def __init__(self, obj: str = "object"):
            """
            obj deletion failed
            """
            self.context = AppExcContext(obj=obj)
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            detail = f"{obj} deletion failed"
            super().__init__(status_code, detail)

    class AlreadyExists(AppExceptionCase):
        def __init__(self, obj: str = "object", field: str = "", value: str | int = ""):
            """
            obj already exists
            """
            if isinstance(value, int):
                value = str(value)
            self.context = AppExcContext(obj=obj, field=field, value=value)
            status_code = status.HTTP_409_CONFLICT
            detail = f"{obj} with {field} '{value}' already exists"
            super().__init__(status_code, detail, self.context)

    class Conflict(AppExceptionCase):
        def __init__(self, detail: str | None = None):
            """
            obj already exists
            """
            status_code = status.HTTP_409_CONFLICT
            detail = detail or "Could not perform the requested operation"
            super().__init__(status_code, detail)

    class NotFound(AppExceptionCase):
        def __init__(
            self, obj: str = "object", field: str = "", value: str | int = "", detail=""
        ):
            """
            obj not found
            """
            if isinstance(value, int):
                value = str(value)
            if field and value:
                self.context = AppExcContext(obj=obj, field=field, value=value)
            else:
                self.context = AppExcContext(obj=obj)
            status_code = status.HTTP_404_NOT_FOUND
            if not detail:
                if field and value:
                    detail = f"{obj} with {field} '{value}' not found"
                else:
                    detail = f"{obj} not found"
            super().__init__(status_code, detail, self.context)

    class PermissionRequired(AppExceptionCase):
        def __init__(self, context: dict[str, Any] | None = None):
            """
            obj requires necessary permissions
            """
            status_code = status.HTTP_401_UNAUTHORIZED
            detail = "Insufficient permissions"
            super().__init__(status_code, detail, context)

    class AuthenticationFailed(AppExceptionCase):
        def __init__(
            self,
            authenticate_value: str = "Bearer",
            detail: str = "Authentication failed",
        ):
            """
            Failed to authenticate user
            """
            status_code = status.HTTP_401_UNAUTHORIZED
            headers = {"WWW-Authenticate": authenticate_value}
            super().__init__(status_code, detail, headers=headers)

    class Unauthorized(AppExceptionCase):
        def __init__(self, detail: str = "Unauthorized"):
            """
            Unauthorized
            """
            status_code = status.HTTP_401_UNAUTHORIZED
            super().__init__(status_code, detail)

    class Forbidden(AppExceptionCase):
        def __init__(self, detail: str = "Forbidden"):
            """
            Access forbidden
            """
            status_code = status.HTTP_403_FORBIDDEN
            super().__init__(status_code, detail)

    class InternalServerError(AppExceptionCase):
        def __init__(self, detail: str = "Internal server error"):
            """
            Internal server error
            """
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            super().__init__(status_code, detail)

    class BadRequest(AppExceptionCase):
        def __init__(self, detail: str = "Bad request"):
            """
            Bad request
            """
            status_code = status.HTTP_400_BAD_REQUEST
            super().__init__(status_code, detail)

    class WebhookBadRequest(AppExceptionCase):
        def __init__(self, detail: str = "Webhook Error"):
            """
            Bad request
            """
            status_code = status.HTTP_400_BAD_REQUEST
            super().__init__(status_code, detail)

    class WebhookUnauthorized(AppExceptionCase):
        def __init__(self, detail: str = "Webhook Signature Verification Failed"):
            """
            Unauthorized
            """
            status_code = status.HTTP_401_UNAUTHORIZED
            super().__init__(status_code, detail)
