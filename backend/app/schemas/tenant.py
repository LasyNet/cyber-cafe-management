"""Schemas for tenant, membership and invitation management."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints
from typing import Annotated

CompanyName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=160)]
EmailAddress = Annotated[str, StringConstraints(strip_whitespace=True, min_length=5, max_length=254)]


class CompanyCreate(BaseModel):
    name: CompanyName


class CompanyUpdate(BaseModel):
    name: CompanyName


class CompanyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    slug: str
    is_active: bool
    role: str
    created_at: datetime


class MemberRead(BaseModel):
    user_id: str
    full_name: str
    email: str
    role: str
    permissions: dict[str, bool]
    is_active: bool
    created_at: datetime


class MemberUpdate(BaseModel):
    role: Literal["admin", "employee"] | None = None
    permissions: dict[str, bool] | None = None
    is_active: bool | None = None


class InvitationCreate(BaseModel):
    email: EmailAddress | None = None
    role: Literal["admin", "employee"] = "employee"
    expires_in_days: int = Field(default=7, ge=1, le=30)


class InvitationRead(BaseModel):
    id: str
    email: str | None
    role: str
    expires_at: datetime
    accepted_at: datetime | None
    revoked_at: datetime | None
    created_at: datetime


class InvitationCreated(InvitationRead):
    invite_token: str


class InvitationAccept(BaseModel):
    invite_token: str = Field(min_length=20, max_length=256)


class InvitationAccepted(BaseModel):
    company_id: str
    company_name: str
    role: str
