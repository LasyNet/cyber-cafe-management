"""Authentication endpoints."""

from collections import deque
from math import ceil
from threading import Lock
from time import monotonic
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import AUTH_COOKIE_NAME, get_current_user
from app.core.config import get_settings
from app.core.security import TOKEN_TTL_SECONDS, create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models import User
from app.schemas.auth import LoginRequest, TokenResponse, UserRead

router = APIRouter(prefix="/auth", tags=["authentication"])
LOGIN_WINDOW_SECONDS = 15 * 60
LOGIN_MAX_FAILURES = 10
_login_failures: dict[str, deque[float]] = {}
_login_failures_lock = Lock()
_DUMMY_PASSWORD_HASH = hash_password("dummy-account-password-not-valid")


def _client_key(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _check_login_rate_limit(request: Request) -> None:
    now = monotonic()
    with _login_failures_lock:
        for key, attempts in list(_login_failures.items()):
            while attempts and now - attempts[0] >= LOGIN_WINDOW_SECONDS:
                attempts.popleft()
            if not attempts:
                _login_failures.pop(key, None)
        attempts = _login_failures.get(_client_key(request), deque())
        if len(attempts) >= LOGIN_MAX_FAILURES:
            retry_after = max(1, ceil(LOGIN_WINDOW_SECONDS - (now - attempts[0])))
            raise HTTPException(
                status_code=429,
                detail="Trop de tentatives de connexion. Réessaie plus tard.",
                headers={"Retry-After": str(retry_after)},
            )


def _record_failed_login(request: Request) -> None:
    with _login_failures_lock:
        attempts = _login_failures.setdefault(_client_key(request), deque())
        attempts.append(monotonic())


def _clear_failed_logins(request: Request) -> None:
    with _login_failures_lock:
        _login_failures.pop(_client_key(request), None)


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
    _check_login_rate_limit(request)
    settings = get_settings()
    if not settings.auth_secret_key:
        raise HTTPException(status_code=503, detail="L'authentification n'est pas configurée.")
    user = db.scalar(select(User).where(func.lower(User.email) == payload.email.lower()))
    password_hash = user.password_hash if user is not None else _DUMMY_PASSWORD_HASH
    password_valid = verify_password(payload.password, password_hash)
    if user is None or not user.is_active or not password_valid:
        _record_failed_login(request)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou mot de passe incorrect.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    _clear_failed_logins(request)
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
