from fastapi import APIRouter

from app.routes.health import router as health_router
from app.routes.auth import router as auth_router
from app.routes.chat import router as chat_router
from app.routes.messages import router as messages_router
from app.routes.assets import router as assets_router
from app.routes.chat_assets import router as chat_assets_router

main_router = APIRouter(prefix="/api")

# Include all module routers here
main_router.include_router(health_router)
main_router.include_router(auth_router)
main_router.include_router(chat_router)
main_router.include_router(messages_router)
main_router.include_router(assets_router)
main_router.include_router(chat_assets_router)
