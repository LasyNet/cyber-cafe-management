"""Reusable authentication and authorization dependencies."""

from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.api.v1.endpoints.auth import AUTH_COOKIE_NAME
from app.core.config import get_settings
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models import User

bearer_scheme = HTTPBearer(auto_error=False)
SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


def get_current_user(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Resolve a bearer token or HttpOnly browser cookie to an active user."""
    settings = get_settings()
    if not settings.auth_secret_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="L'authentification n'est pas configurée sur ce serveur.",
        )

    cookie_token = request.cookies.get(AUTH_COOKIE_NAME)
    if credentials is not None:
        token = credentials.credentials
    elif cookie_token:
        token = cookie_token
        if request.method.upper() not in SAFE_METHODS:
            origin = request.headers.get("origin")
            if not origin or origin not in settings.cors_origin_list:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Origine de requête non autorisée.",
                )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentification requise.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    claims = decode_access_token(token, settings.auth_secret_key)
    user = db.get(User, claims["sub"])
    if user is None or not user.is_active or user.role != claims["role"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Compte invalide ou désactivé.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_admin(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """Allow sensitive configuration operations to administrators only."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Droits administrateur requis.",
        )
    return current_user
