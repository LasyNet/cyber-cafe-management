"""Company, membership, permission and invitation endpoints."""

import hashlib
import re
import secrets
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import (
    get_active_company_id,
    get_current_user,
    require_company_admin,
    require_permission,
)
from app.core.permissions import ALL_PERMISSIONS, DEFAULT_EMPLOYEE_PERMISSIONS, PERMISSION_GROUPS
from app.db.session import get_db
from app.models import AppSetting, Company, CompanyMember, Invitation, User
from app.schemas.tenant import (
    CompanyCreate,
    CompanyRead,
    CompanyUpdate,
    InvitationAccept,
    InvitationAccepted,
    InvitationCreate,
    InvitationCreated,
    InvitationRead,
    MemberRead,
    MemberUpdate,
)

router = APIRouter(prefix="/companies", tags=["companies"])


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:150] or "entreprise"


def _invitation_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _expired(expires_at: datetime) -> bool:
    expiry = expires_at if expires_at.tzinfo else expires_at.replace(tzinfo=UTC)
    return expiry <= datetime.now(UTC)


def _membership_read(membership: CompanyMember) -> dict:
    return {
        "id": membership.company.id,
        "name": membership.company.name,
        "slug": membership.company.slug,
        "is_active": membership.company.is_active,
        "role": membership.role,
        "created_at": membership.company.created_at,
    }


def _invitation_status(invitation: Invitation) -> str:
    if invitation.revoked_at:
        return "revoked"
    if invitation.accepted_at:
        return "accepted"
    if _expired(invitation.expires_at):
        return "expired"
    return "pending"


def _ensure_company_admin(db: Session, user_id: str, company_id: str) -> CompanyMember:
    membership = db.get(CompanyMember, (user_id, company_id))
    if membership is None or not membership.is_active or membership.role != "admin":
        raise HTTPException(status_code=403, detail="Droits administrateur requis.")
    return membership


@router.get("", response_model=list[CompanyRead])
def list_companies(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    memberships = db.scalars(
        select(CompanyMember)
        .join(Company, Company.id == CompanyMember.company_id)
        .where(
            CompanyMember.user_id == current_user.id,
            CompanyMember.is_active.is_(True),
            Company.is_active.is_(True),
        )
        .order_by(Company.name)
    ).all()
    return [_membership_read(item) for item in memberships]


@router.post("", response_model=CompanyRead, status_code=status.HTTP_201_CREATED)
def create_company(
    payload: CompanyCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    base_slug = _slugify(payload.name)
    slug = base_slug
    while db.scalar(select(Company.id).where(Company.slug == slug)):
        slug = f"{base_slug}-{secrets.token_hex(3)}"
    company = Company(name=payload.name, slug=slug, created_by=current_user.id, is_active=True)
    db.add(company)
    db.flush()
    membership = CompanyMember(
        user_id=current_user.id,
        company_id=company.id,
        role="admin",
        permissions={},
        is_active=True,
    )
    db.add(membership)
    db.add(
        AppSetting(
            company_id=company.id,
            cafe_name=payload.name,
            hourly_rate=1200,
            currency="Ar",
        )
    )
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Impossible de créer cette entreprise.") from exc
    db.refresh(company)
    return {
        "id": company.id,
        "name": company.name,
        "slug": company.slug,
        "is_active": company.is_active,
        "role": membership.role,
        "created_at": company.created_at,
    }


@router.patch("/current", response_model=CompanyRead)
def update_current_company(
    payload: CompanyUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    company_id: Annotated[str, Depends(get_active_company_id)],
    db: Annotated[Session, Depends(get_db)],
    _admin: Annotated[User, Depends(require_company_admin)],
):
    company = db.get(Company, company_id)
    if company is None or not company.is_active:
        raise HTTPException(status_code=404, detail="Entreprise introuvable.")
    company.name = payload.name
    settings = db.scalar(select(AppSetting).where(AppSetting.company_id == company_id))
    if settings:
        settings.cafe_name = payload.name
    db.commit()
    membership = db.get(CompanyMember, (current_user.id, company_id))
    return {
        "id": company.id,
        "name": company.name,
        "slug": company.slug,
        "is_active": company.is_active,
        "role": membership.role,
        "created_at": company.created_at,
    }


@router.get("/access")
def current_company_access(
    current_user: Annotated[User, Depends(get_current_user)],
    company_id: Annotated[str, Depends(get_active_company_id)],
    db: Annotated[Session, Depends(get_db)],
):
    """Return the effective role and permissions in the selected company."""
    membership = db.get(CompanyMember, (current_user.id, company_id))
    if membership is None or not membership.is_active:
        raise HTTPException(status_code=403, detail="Accès à cette entreprise refusé.")
    if membership.role == "admin":
        permissions = {key: True for key in ALL_PERMISSIONS}
    else:
        permissions = {
            **DEFAULT_EMPLOYEE_PERMISSIONS,
            **(membership.permissions or {}),
        }
    return {"company_id": company_id, "role": membership.role, "permissions": permissions}


@router.get("/permissions")
def permission_catalog():
    """Return the canonical permission catalogue and employee defaults."""
    return {
        "groups": {key: list(value) for key, value in PERMISSION_GROUPS.items()},
        "all_permissions": list(ALL_PERMISSIONS),
        "default_employee_permissions": DEFAULT_EMPLOYEE_PERMISSIONS,
    }


@router.get("/members", response_model=list[MemberRead], dependencies=[Depends(require_permission("personnel.manage"))])
def list_members(
    company_id: Annotated[str, Depends(get_active_company_id)],
    db: Annotated[Session, Depends(get_db)],
):
    memberships = db.scalars(
        select(CompanyMember)
        .join(User, User.id == CompanyMember.user_id)
        .where(CompanyMember.company_id == company_id)
        .order_by(User.full_name)
    ).all()
    return [
        {
            "user_id": item.user_id,
            "full_name": item.user.full_name,
            "email": item.user.email,
            "role": item.role,
            "permissions": item.permissions or {},
            "is_active": item.is_active,
            "created_at": item.created_at,
        }
        for item in memberships
    ]


@router.patch("/members/{user_id}", response_model=MemberRead)
def update_member(
    user_id: str,
    payload: MemberUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    company_id: Annotated[str, Depends(get_active_company_id)],
    db: Annotated[Session, Depends(get_db)],
    _admin: Annotated[User, Depends(require_company_admin)],
):
    membership = db.get(CompanyMember, (user_id, company_id))
    if membership is None:
        raise HTTPException(status_code=404, detail="Membre introuvable.")
    data = payload.model_dump(exclude_unset=True)
    if "permissions" in data and data["permissions"] is not None:
        unknown = set(data["permissions"]) - set(ALL_PERMISSIONS)
        if unknown:
            raise HTTPException(
                status_code=422,
                detail=f"Permissions inconnues : {', '.join(sorted(unknown))}.",
            )
        if data.get("role", membership.role) == "admin" and data["permissions"]:
            raise HTTPException(
                status_code=422,
                detail="Les administrateurs disposent déjà de tous les droits.",
            )
    new_role = data.get("role", membership.role)
    deactivating = data.get("is_active") is False and membership.is_active
    losing_admin = membership.role == "admin" and (
        new_role != "admin" or deactivating
    )
    if losing_admin:
        if user_id == current_user.id:
            raise HTTPException(status_code=409, detail="Vous ne pouvez pas retirer vos propres droits administrateur.")
        other_admins = db.scalar(
            select(func.count())
            .select_from(CompanyMember)
            .where(
                CompanyMember.company_id == company_id,
                CompanyMember.role == "admin",
                CompanyMember.is_active.is_(True),
                CompanyMember.user_id != user_id,
            )
        ) or 0
        if other_admins == 0:
            raise HTTPException(status_code=409, detail="L'entreprise doit conserver au moins un administrateur.")
    for key, value in data.items():
        if value is not None:
            setattr(membership, key, value)
    db.commit()
    db.refresh(membership)
    return {
        "user_id": membership.user_id,
        "full_name": membership.user.full_name,
        "email": membership.user.email,
        "role": membership.role,
        "permissions": membership.permissions or {},
        "is_active": membership.is_active,
        "created_at": membership.created_at,
    }


@router.post("/invitations", response_model=InvitationCreated, status_code=status.HTTP_201_CREATED)
def create_invitation(
    payload: InvitationCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    company_id: Annotated[str, Depends(get_active_company_id)],
    db: Annotated[Session, Depends(get_db)],
    _admin: Annotated[User, Depends(require_company_admin)],
):
    email = payload.email.lower() if payload.email else None
    if email:
        invited_user = db.scalar(select(User).where(func.lower(User.email) == email))
        if invited_user and db.get(CompanyMember, (invited_user.id, company_id)):
            raise HTTPException(status_code=409, detail="Cet utilisateur est déjà membre de l'entreprise.")
    raw_token = secrets.token_urlsafe(32)
    invitation = Invitation(
        company_id=company_id,
        email=email,
        token_hash=_invitation_hash(raw_token),
        role=payload.role,
        expires_at=datetime.now(UTC) + timedelta(days=payload.expires_in_days),
        created_by=current_user.id,
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    return {
        "id": invitation.id,
        "email": invitation.email,
        "role": invitation.role,
        "expires_at": invitation.expires_at,
        "accepted_at": invitation.accepted_at,
        "revoked_at": invitation.revoked_at,
        "created_at": invitation.created_at,
        "invite_token": raw_token,
    }


@router.get("/invitations", response_model=list[InvitationRead], dependencies=[Depends(require_permission("personnel.manage"))])
def list_invitations(
    company_id: Annotated[str, Depends(get_active_company_id)],
    db: Annotated[Session, Depends(get_db)],
):
    invitations = db.scalars(
        select(Invitation)
        .where(Invitation.company_id == company_id)
        .order_by(Invitation.created_at.desc())
    ).all()
    return invitations


@router.delete("/invitations/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_invitation(
    invitation_id: str,
    company_id: Annotated[str, Depends(get_active_company_id)],
    db: Annotated[Session, Depends(get_db)],
    _admin: Annotated[User, Depends(require_company_admin)],
):
    invitation = db.scalar(
        select(Invitation).where(
            Invitation.id == invitation_id,
            Invitation.company_id == company_id,
        )
    )
    if invitation is None:
        raise HTTPException(status_code=404, detail="Invitation introuvable.")
    if invitation.accepted_at:
        raise HTTPException(status_code=409, detail="Cette invitation a déjà été acceptée.")
    if invitation.revoked_at:
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    invitation.revoked_at = datetime.now(UTC)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/invitations/accept", response_model=InvitationAccepted)
def accept_invitation(
    payload: InvitationAccept,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    invitation = db.scalar(
        select(Invitation).where(Invitation.token_hash == _invitation_hash(payload.invite_token)).with_for_update()
    )
    if invitation is None or invitation.revoked_at or invitation.accepted_at:
        raise HTTPException(status_code=404, detail="Invitation invalide ou déjà utilisée.")
    if _expired(invitation.expires_at):
        raise HTTPException(status_code=410, detail="Cette invitation a expiré.")
    if invitation.email and invitation.email.lower() != current_user.email.lower():
        raise HTTPException(status_code=403, detail="Cette invitation est réservée à une autre adresse e-mail.")
    if db.get(CompanyMember, (current_user.id, invitation.company_id)):
        raise HTTPException(status_code=409, detail="Vous êtes déjà membre de cette entreprise.")
    company = db.get(Company, invitation.company_id)
    if company is None or not company.is_active:
        raise HTTPException(status_code=404, detail="Entreprise introuvable ou inactive.")
    membership = CompanyMember(
        user_id=current_user.id,
        company_id=company.id,
        role=invitation.role,
        permissions={},
        is_active=True,
    )
    invitation.accepted_at = datetime.now(UTC)
    db.add(membership)
    db.commit()
    return {
        "company_id": company.id,
        "company_name": company.name,
        "role": membership.role,
    }
