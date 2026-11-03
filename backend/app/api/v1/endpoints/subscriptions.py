"""Company subscription status and manual Premium activation."""

from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import (
    get_active_company_id,
    get_current_user,
    require_admin,
    require_company_admin,
)
from app.core.plans import FREE_LIMITS, PREMIUM_LIMITS, effective_plan
from app.db.session import get_db
from app.models import Company, SubscriptionRequest, User
from app.schemas.subscriptions import SubscriptionActivation, SubscriptionRequestCreate

router = APIRouter(tags=["subscriptions"])


def _company_plan(company: Company) -> dict:
    plan = effective_plan(company)
    return {
        "company_id": company.id,
        "plan": plan,
        "subscription_status": (
            "expired"
            if company.plan == "premium" and plan == "free" and company.subscription_expires_at
            else company.subscription_status
        ),
        "subscription_started_at": company.subscription_started_at,
        "subscription_expires_at": company.subscription_expires_at,
        "limits": PREMIUM_LIMITS if plan == "premium" else FREE_LIMITS,
    }


@router.get("/companies/subscription")
def get_company_subscription(
    company_id: Annotated[str, Depends(get_active_company_id)],
    db: Annotated[Session, Depends(get_db)],
):
    company = db.get(Company, company_id)
    if company is None or not company.is_active:
        raise HTTPException(status_code=404, detail="Entreprise introuvable.")
    return _company_plan(company)


@router.post("/companies/subscription/request", status_code=status.HTTP_201_CREATED)
def request_premium_upgrade(
    payload: SubscriptionRequestCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    company_id: Annotated[str, Depends(get_active_company_id)],
    db: Annotated[Session, Depends(get_db)],
    _admin: Annotated[User, Depends(require_company_admin)],
):
    company = db.get(Company, company_id)
    if company is None or not company.is_active:
        raise HTTPException(status_code=404, detail="Entreprise introuvable.")
    if effective_plan(company) == "premium":
        raise HTTPException(status_code=409, detail="Cette entreprise dispose déjà de Premium.")
    pending = db.scalar(
        select(SubscriptionRequest).where(
            SubscriptionRequest.company_id == company_id,
            SubscriptionRequest.status == "pending",
        )
    )
    if pending:
        raise HTTPException(status_code=409, detail="Une demande Premium est déjà en attente.")
    request = SubscriptionRequest(
        company_id=company_id,
        requested_by=current_user.id,
        message=payload.message,
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return {
        "id": request.id,
        "company_id": request.company_id,
        "status": request.status,
        "message": request.message,
        "created_at": request.created_at,
    }


@router.get("/platform/subscription-requests", dependencies=[Depends(require_admin)])
def list_subscription_requests(db: Annotated[Session, Depends(get_db)]):
    requests = db.scalars(
        select(SubscriptionRequest)
        .where(SubscriptionRequest.status == "pending")
        .order_by(SubscriptionRequest.created_at)
    ).all()
    return [
        {
            "id": item.id,
            "company_id": item.company_id,
            "company_name": item.company.name,
            "requested_by": item.requested_by,
            "requested_by_name": item.requester.full_name,
            "message": item.message,
            "status": item.status,
            "created_at": item.created_at,
        }
        for item in requests
    ]


@router.post(
    "/platform/subscription-requests/{request_id}/activate",
    dependencies=[Depends(require_admin)],
)
def activate_premium(
    request_id: str,
    payload: SubscriptionActivation,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    request = db.scalar(
        select(SubscriptionRequest)
        .where(SubscriptionRequest.id == request_id)
        .with_for_update()
    )
    if request is None:
        raise HTTPException(status_code=404, detail="Demande Premium introuvable.")
    if request.status != "pending":
        raise HTTPException(status_code=409, detail="Cette demande a déjà été traitée.")
    company = db.get(Company, request.company_id)
    if company is None or not company.is_active:
        raise HTTPException(status_code=404, detail="Entreprise introuvable ou inactive.")
    now = datetime.now(UTC)
    company.plan = "premium"
    company.subscription_status = "active"
    company.subscription_started_at = now
    company.subscription_expires_at = now + timedelta(days=payload.duration_days)
    request.status = "approved"
    request.reviewed_by = current_user.id
    request.reviewed_at = now
    request.duration_days = payload.duration_days
    db.commit()
    return {
        "company_id": company.id,
        "company_name": company.name,
        "plan": company.plan,
        "subscription_status": company.subscription_status,
        "subscription_started_at": company.subscription_started_at,
        "subscription_expires_at": company.subscription_expires_at,
    }
