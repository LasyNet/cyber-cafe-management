"""Subscription plans and server-side quota enforcement."""

from datetime import UTC, datetime, timedelta

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Company, CompanyMember, Invitation

FREE_LIMITS = {
    "computers": 5,
    "employees": 2,
    "admins": 1,
    "clients": 100,
    "companies": 1,
    "history_days": 30,
}
PREMIUM_LIMITS = {
    "computers": None,
    "employees": None,
    "admins": None,
    "clients": None,
    "companies": None,
    "history_days": None,
}


def effective_plan(company: Company, now: datetime | None = None) -> str:
    """Return the currently effective plan, falling back to Free after expiry."""
    now = now or datetime.now(UTC)
    if company.plan != "premium" or company.subscription_status != "active":
        return "free"
    expiry = company.subscription_expires_at
    if expiry is not None:
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=UTC)
        if expiry <= now:
            return "free"
    return "premium"


def plan_limits(company: Company) -> dict[str, int | None]:
    """Return quotas for the company's effective plan."""
    return PREMIUM_LIMITS if effective_plan(company) == "premium" else FREE_LIMITS


def require_quota(
    db: Session,
    company: Company,
    model: type,
    quota_key: str,
    label: str,
) -> None:
    """Reject creation when a Free workspace has reached its configured quota."""
    limit = plan_limits(company).get(quota_key)
    if limit is None:
        return
    current = db.scalar(
        select(func.count()).select_from(model).where(model.company_id == company.id)
    ) or 0
    if current >= limit:
        raise HTTPException(
            status_code=403,
            detail=(
                f"La limite de l'offre Gratuite est atteinte ({limit} {label}). "
                "Passez à Premium pour continuer."
            ),
        )


def require_staff_quota(db: Session, company: Company, role: str) -> None:
    """Enforce Free staff quotas, including invitations that are still pending."""
    limits = plan_limits(company)
    limit = limits["employees" if role == "employee" else "admins"]
    if limit is None:
        return
    active_count = db.scalar(
        select(func.count())
        .select_from(CompanyMember)
        .where(
            CompanyMember.company_id == company.id,
            CompanyMember.role == role,
            CompanyMember.is_active.is_(True),
        )
    ) or 0
    pending_count = db.scalar(
        select(func.count())
        .select_from(Invitation)
        .where(
            Invitation.company_id == company.id,
            Invitation.role == role,
            Invitation.accepted_at.is_(None),
            Invitation.revoked_at.is_(None),
            Invitation.expires_at > datetime.now(UTC),
        )
    ) or 0
    if active_count + pending_count >= limit:
        label = "employés" if role == "employee" else "administrateur"
        raise HTTPException(
            status_code=403,
            detail=(
                f"L'offre Gratuite autorise {limit} {label} au maximum. "
                "Passez à Premium pour ajouter d'autres membres."
            ),
        )


def history_cutoff(company: Company, now: datetime | None = None) -> datetime | None:
    """Return the earliest visible history date for the company's current plan."""
    days = plan_limits(company)["history_days"]
    if days is None:
        return None
    return (now or datetime.now(UTC)) - timedelta(days=days)
