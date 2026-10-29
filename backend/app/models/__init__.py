"""SQLAlchemy models for the cyber-café domain."""

from datetime import datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import (
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
    """Staff account; only a secure password hash may be stored."""

    __tablename__ = "users"
    __table_args__ = (
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


class Client(Base):
    """Customer registered for cyber-café sessions."""

    __tablename__ = "clients"

    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: new_id("CL"))
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
        Index("uq_computers_mac_address", "mac_address", unique=True),
    )

    id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: new_id("PC"))
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
    """Cafe-level settings; the database migration enforces a single row."""

    __tablename__ = "app_settings"
    __table_args__ = (
        CheckConstraint("id = 1", name="ck_app_settings_singleton"),
        CheckConstraint("hourly_rate >= 0", name="ck_app_settings_hourly_rate"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
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
