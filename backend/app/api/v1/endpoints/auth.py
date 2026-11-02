"""Authentication endpoints."""

import hmac
from collections import deque
from math import ceil
from threading import Lock
from time import monotonic
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import func, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import AUTH_COOKIE_NAME, get_current_user
from app.core.config import get_settings
from app.core.security import TOKEN_TTL_SECONDS, create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models import Company, CompanyMember, User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserRead

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


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Create the first administrator; later accounts require a configured invite code."""
    _require_trusted_origin(request)
    _check_login_rate_limit(request)
    settings = get_settings()

    # Serialize first-account decisions across concurrent PostgreSQL requests.
    if db.get_bind().dialect.name == "postgresql":
        db.execute(text("SELECT pg_advisory_xact_lock(731904221)"))

    existing_count = db.scalar(select(func.count()).select_from(User)) or 0
    if existing_count:
        expected_code = settings.registration_invite_code
        supplied_code = payload.invite_code or ""
        if not expected_code or not hmac.compare_digest(
            supplied_code.encode(), expected_code.encode()
        ):
            _record_failed_login(request)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Les inscriptions sont réservées au personnel invité. "
                    "Demande un code d’invitation à l’administrateur."
                ),
            )
        role = "employee"
    else:
        role = "admin"

    if db.scalar(select(User.id).where(func.lower(User.email) == payload.email)):
        _record_failed_login(request)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un compte avec cette adresse e-mail existe déjà.",
        )

    try:
        user = User(
            full_name=payload.full_name,
            email=payload.email,
            password_hash=hash_password(payload.password),
            role=role,
            is_active=True,
        )
        db.add(user)
        db.flush()

        # Transitional onboarding: new accounts join the migrated legacy
        # workspace until company creation and per-company invitations ship.
        company = db.scalar(
            select(Company).where(Company.slug == "legacy-cyber-cafe")
        )
        if company is None:
            company = Company(
                name="Cyber Café Central",
                slug="legacy-cyber-cafe",
                created_by=user.id if role == "admin" else None,
                is_active=True,
            )
            db.add(company)
            db.flush()
        elif role == "admin" and company.created_by is None:
            company.created_by = user.id

        db.add(
            CompanyMember(
                user_id=user.id,
                company_id=company.id,
                role=role,
                is_active=True,
            )
        )
        db.commit()
        db.refresh(user)
        _clear_failed_logins(request)
        return user
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un compte avec cette adresse e-mail existe déjà.",
        ) from exc
    except Exception:
        db.rollback()
        raise


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
        # Render frontend and API use separate origins; production cookies must
        # be eligible for credentialed cross-origin fetch requests.
        samesite="none" if settings.app_env.lower() == "production" else "lax",
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
        samesite="none" if settings.app_env.lower() == "production" else "lax",
    )
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """Return the authenticated staff member's public profile."""
    return current_user
