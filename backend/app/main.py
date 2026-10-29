"""FastAPI application factory and ASGI entry point."""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.business import router as business_router
from app.api.v1.endpoints.health import router as health_router
from app.core.config import get_settings


def create_app() -> FastAPI:
    """Build the application with explicit, testable configuration."""
    settings = get_settings()
    if settings.app_env.lower() == "production" and (
        len(settings.auth_secret_key) < 32
        or settings.auth_secret_key == "local-development-secret-change-me"
        or settings.auth_secret_key == "replace-with-a-long-random-secret-before-deploying"
    ):
        raise RuntimeError("Configure a unique random AUTH_SECRET_KEY of at least 32 characters.")
    application = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        docs_url="/docs" if settings.app_env != "production" else None,
        redoc_url="/redoc" if settings.app_env != "production" else None,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    @application.middleware("http")
    async def add_security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault(
            "Permissions-Policy", "camera=(), microphone=(), geolocation=()"
        )
        if request.url.path.startswith(settings.api_v1_prefix):
            response.headers["Cache-Control"] = "no-store"
        return response

    application.include_router(health_router, prefix=settings.api_v1_prefix)
    application.include_router(auth_router, prefix=settings.api_v1_prefix)
    application.include_router(business_router, prefix=settings.api_v1_prefix)
    return application


app = create_app()
