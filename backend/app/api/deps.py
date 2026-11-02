"""Reusable authentication and authorization dependencies."""

from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models import Company, CompanyMember, User

AUTH_COOKIE_NAME = "lasynet_session"
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


def get_active_company_id(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> str:
    """Resolve the selected company and verify the user's active membership."""
    memberships = db.scalars(
        select(CompanyMember)
        .join(Company, Company.id == CompanyMember.company_id)
        .where(
            CompanyMember.user_id == current_user.id,
            CompanyMember.is_active.is_(True),
            Company.is_active.is_(True),
        )
        .order_by(CompanyMember.created_at, CompanyMember.company_id)
    ).all()

    requested_company_id = request.headers.get("x-company-id")
    if requested_company_id:
        membership = next(
            (item for item in memberships if item.company_id == requested_company_id),
            None,
        )
        if membership is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous ne faites pas partie de cette entreprise.",
            )
        return membership.company_id

    if not memberships:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Aucune entreprise active n'est associée à ce compte.",
        )
    if len(memberships) > 1:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Sélectionnez une entreprise avant d'accéder à ses données.",
        )
    return memberships[0].company_id


def require_permission(permission: str):
    """Build a dependency that enforces a company-scoped permission."""

    def dependency(
        current_user: User = Depends(get_current_user),
        company_id: str = Depends(get_active_company_id),
        db: Session = Depends(get_db),
    ) -> User:
        membership = db.get(CompanyMember, (current_user.id, company_id))
        if membership is None or not membership.is_active:
            raise HTTPException(status_code=403, detail="Accès à cette entreprise refusé.")
        if membership.role == "admin":
            return current_user
        from app.core.permissions import DEFAULT_EMPLOYEE_PERMISSIONS

        overrides = membership.permissions or {}
        allowed = overrides.get(permission, DEFAULT_EMPLOYEE_PERMISSIONS.get(permission, False))
        if allowed is not True:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission insuffisante pour effectuer cette action.",
            )
        return current_user

    return dependency


def require_company_admin(
    current_user: Annotated[User, Depends(get_current_user)],
    company_id: Annotated[str, Depends(get_active_company_id)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Authorize an administrator in the currently selected company only."""
    membership = db.get(CompanyMember, (current_user.id, company_id))
    if membership is None or not membership.is_active or membership.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Droits administrateur requis pour cette entreprise.",
        )
    return current_user
