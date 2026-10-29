"""Authentication endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import AUTH_COOKIE_NAME, get_current_user
from app.core.config import get_settings
from app.core.security import TOKEN_TTL_SECONDS, create_access_token, verify_password
from app.db.session import get_db
from app.models import User
from app.schemas.auth import LoginRequest, TokenResponse, UserRead

router = APIRouter(prefix="/auth", tags=["authentication"])


def _require_trusted_origin(request: Request) -> None:
    """Reject browser login/logout requests from untrusted origins."""
    origin = request.headers.get("origin")
    if not origin or origin not in get_settings().cors_origin_list:
        raise HTTPException(status_code=403, detail="Origine de requête non autorisée.")


@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    """Authenticate a staff account and establish an HttpOnly browser session."""
    _require_trusted_origin(request)
    settings = get_settings()
    if not settings.auth_secret_key:
        raise HTTPException(status_code=503, detail="L'authentification n'est pas configurée.")
    user = db.scalar(select(User).where(func.lower(User.email) == payload.email.lower()))
    if (
        user is None
        or not user.is_active
        or not verify_password(payload.password, user.password_hash)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou mot de passe incorrect.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(
        user_id=user.id,
        role=user.role,
        secret_key=settings.auth_secret_key,
    )
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        max_age=TOKEN_TTL_SECONDS,
        httponly=True,
        secure=settings.app_env.lower() == "production",
        samesite="lax",
        path=settings.api_v1_prefix,
    )
    return TokenResponse(expires_in=TOKEN_TTL_SECONDS)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request, response: Response) -> Response:
    """Clear the browser session cookie."""
    _require_trusted_origin(request)
    settings = get_settings()
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        path=settings.api_v1_prefix,
        secure=settings.app_env.lower() == "production",
        httponly=True,
        samesite="lax",
    )
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """Return the authenticated staff member's public profile."""
    return current_user
