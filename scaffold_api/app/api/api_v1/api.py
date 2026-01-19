from fastapi import APIRouter

from app.api.api_v1.routers import (
    login_ep,
    users_ep,
)

api_router = APIRouter()
api_router.include_router(login_ep.router, tags=["login"])
api_router.include_router(users_ep.router, prefix="/users", tags=["users"])
