"""SQLAlchemy models for the multi-company cyber-café platform."""

from datetime import datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def new_id(prefix: str) -> str:
    """Create readable identifiers with globally unique suffixes."""
    return f"{prefix}-{uuid4().hex[:12].upper()}"


class User(Base):
    """Global identity; company-specific permissions live in CompanyMember."""

    __tablename__ = "users"
    __table_args__ = (
        # Kept temporarily for backwards compatibility during the auth migration.
        CheckConstraint("role IN ('admin', 'employee')", name="ck_users_role"),
        UniqueConstraint("email", name="uq_users_email"),
    )

    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: new_id("USR"))
    full_name: Mapped[str] = mapped_column(String(160), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="employee")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    company_memberships: Mapped[list["CompanyMember"]] = relationship(back_populates="user")
    created_companies: Mapped[list["Company"]] = relationship(
        back_populates="created_by_user", foreign_keys="Company.created_by"
    )


class Company(Base):
    """A tenant workspace; all operational data belongs to one company."""

    __tablename__ = "companies"
    __table_args__ = (
        UniqueConstraint("slug", name="uq_companies_slug"),
        CheckConstraint("plan IN ('free', 'premium')", name="ck_companies_plan"),
        CheckConstraint(
            "subscription_status IN ('active', 'expired', 'cancelled')",
            name="ck_companies_subscription_status",
        ),
    )

    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: new_id("CMP"))
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    slug: Mapped[str] = mapped_column(String(180), nullable=False)
    created_by: Mapped[str | None] = mapped_column(
        String(40), ForeignKey("users.id", ondelete="SET NULL")
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    plan: Mapped[str] = mapped_column(String(20), nullable=False, default="free")
    subscription_status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    subscription_started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    subscription_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    created_by_user: Mapped[User | None] = relationship(
        back_populates="created_companies", foreign_keys=[created_by]
    )
    memberships: Mapped[list["CompanyMember"]] = relationship(back_populates="company")
    invitations: Mapped[list["Invitation"]] = relationship(back_populates="company")


class CompanyMember(Base):
    """Membership and authorization role for one user in one company."""

    __tablename__ = "company_members"
    __table_args__ = (
        CheckConstraint("role IN ('admin', 'employee')", name="ck_company_members_role"),
        Index("ix_company_members_company_id", "company_id"),
    )

    user_id: Mapped[str] = mapped_column(
        String(40), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    company_id: Mapped[str] = mapped_column(
        String(40), ForeignKey("companies.id", ondelete="CASCADE"), primary_key=True
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="employee")
    permissions: Mapped[dict[str, bool]] = mapped_column(JSON, nullable=False, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped[User] = relationship(back_populates="company_memberships")
    company: Mapped[Company] = relationship(back_populates="memberships")


class Invitation(Base):
    """Single-use, company-scoped invitation; only a token hash is persisted."""

    __tablename__ = "invitations"
    __table_args__ = (
        CheckConstraint("role IN ('admin', 'employee')", name="ck_invitations_role"),
        UniqueConstraint("token_hash", name="uq_invitations_token_hash"),
        Index("ix_invitations_company_id", "company_id"),
        Index("ix_invitations_expires_at", "expires_at"),
    )

    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: new_id("INV"))
    company_id: Mapped[str] = mapped_column(
        String(40), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    email: Mapped[str | None] = mapped_column(String(254))
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="employee")
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_by: Mapped[str | None] = mapped_column(
        String(40), ForeignKey("users.id", ondelete="SET NULL")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    company: Mapped[Company] = relationship(back_populates="invitations")
    creator: Mapped[User | None] = relationship(foreign_keys=[created_by])


class Client(Base):
    """Customer registered for cyber-café sessions."""

    __tablename__ = "clients"

    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: new_id("CL"))
    company_id: Mapped[str] = mapped_column(
        String(40), ForeignKey("companies.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(40))
    email: Mapped[str | None] = mapped_column(String(254), index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    sessions: Mapped[list["CafeSession"]] = relationship(back_populates="client")
    payments: Mapped[list["Payment"]] = relationship(back_populates="client")


class Computer(Base):
    """A physical or external computer offered to customers."""

    __tablename__ = "computers"
    __table_args__ = (
        CheckConstraint(
            "computer_type IN ('Interne', 'Externe')",
            name="ck_computers_type",
        ),
        CheckConstraint(
            "status IN ('Disponible', 'En cours', 'Maintenance')",
            name="ck_computers_status",
        ),
        Index("uq_computers_company_mac_address", "company_id", "mac_address", unique=True),
    )

    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: new_id("PC"))
    company_id: Mapped[str] = mapped_column(
        String(40), ForeignKey("companies.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    computer_type: Mapped[str] = mapped_column(String(20), nullable=False, default="Interne")
    mac_address: Mapped[str | None] = mapped_column(String(17))
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="Disponible", index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    sessions: Mapped[list["CafeSession"]] = relationship(back_populates="computer")


class CafeSession(Base):
    """Customer usage period on a computer."""

    __tablename__ = "cafe_sessions"
    __table_args__ = (
        CheckConstraint(
            "status IN ('En cours', 'Terminée')",
            name="ck_cafe_sessions_status",
        ),
        CheckConstraint(
            "planned_hours IS NULL OR planned_hours > 0",
            name="ck_cafe_sessions_planned_hours",
        ),
        CheckConstraint("amount >= 0", name="ck_cafe_sessions_amount"),
        Index("ix_cafe_sessions_started_at", "started_at"),
    )

    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: new_id("SES"))
    company_id: Mapped[str] = mapped_column(
        String(40), ForeignKey("companies.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    computer_id: Mapped[str] = mapped_column(
        String(40),
        ForeignKey("computers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    client_id: Mapped[str] = mapped_column(
        String(40),
        ForeignKey("clients.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    planned_hours: Mapped[Decimal | None] = mapped_column(Numeric(8, 2))
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="En cours", index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0"))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    computer: Mapped[Computer] = relationship(back_populates="sessions")
    client: Mapped[Client] = relationship(back_populates="sessions")
    payments: Mapped[list["Payment"]] = relationship(back_populates="session")


class Payment(Base):
    """Payment or outstanding amount linked to a session and customer."""

    __tablename__ = "payments"
    __table_args__ = (
        CheckConstraint(
            "method IN ('Espèces', 'Mobile Money', 'Carte')",
            name="ck_payments_method",
        ),
        CheckConstraint(
            "status IN ('Payé', 'En attente')",
            name="ck_payments_status",
        ),
        CheckConstraint("amount >= 0", name="ck_payments_amount"),
        Index("ix_payments_paid_at", "paid_at"),
    )

    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: new_id("PAY"))
    company_id: Mapped[str] = mapped_column(
        String(40), ForeignKey("companies.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    session_id: Mapped[str] = mapped_column(
        String(40),
        ForeignKey("cafe_sessions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    client_id: Mapped[str] = mapped_column(
        String(40),
        ForeignKey("clients.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    method: Mapped[str] = mapped_column(String(30), nullable=False)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="En attente", index=True
    )
    reference: Mapped[str | None] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    session: Mapped[CafeSession] = relationship(back_populates="payments")
    client: Mapped[Client] = relationship(back_populates="payments")


class AppSetting(Base):
    """Settings belonging to one company; one row per tenant."""

    __tablename__ = "app_settings"
    __table_args__ = (
        UniqueConstraint("company_id", name="uq_app_settings_company_id"),
        CheckConstraint("hourly_rate >= 0", name="ck_app_settings_hourly_rate"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    company_id: Mapped[str] = mapped_column(
        String(40), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    cafe_name: Mapped[str] = mapped_column(
        String(160), nullable=False, default="Cyber Café Central"
    )
    hourly_rate: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("1200")
    )
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="Ar")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )



class SubscriptionRequest(Base):
    """A manual Premium upgrade request reviewed by a platform administrator."""

    __tablename__ = "subscription_requests"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'approved', 'rejected')",
            name="ck_subscription_requests_status",
        ),
        Index("ix_subscription_requests_company_status", "company_id", "status"),
    )

    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: new_id("SUB"))
    company_id: Mapped[str] = mapped_column(
        String(40), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    requested_by: Mapped[str] = mapped_column(
        String(40), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    message: Mapped[str | None] = mapped_column(Text)
    reviewed_by: Mapped[str | None] = mapped_column(
        String(40), ForeignKey("users.id", ondelete="SET NULL")
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    duration_days: Mapped[int | None] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    company: Mapped["Company"] = relationship()
    requester: Mapped["User"] = relationship(foreign_keys=[requested_by])
    reviewer: Mapped["User | None"] = relationship(foreign_keys=[reviewed_by])
