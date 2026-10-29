"""Create the initial cyber-cafe schema.

Revision ID: 20261029_0001
Revises:
Create Date: 2026-10-29
"""

from alembic import op
import sqlalchemy as sa

revision = "20261029_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=40), primary_key=True),
        sa.Column("full_name", sa.String(length=160), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), server_default="employee", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("role IN ('admin', 'employee')", name="ck_users_role"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_table(
        "clients",
        sa.Column("id", sa.String(length=40), primary_key=True),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("phone", sa.String(length=40)),
        sa.Column("email", sa.String(length=254)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_clients_name", "clients", ["name"])
    op.create_index("ix_clients_email", "clients", ["email"])

    op.create_table(
        "computers",
        sa.Column("id", sa.String(length=40), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("computer_type", sa.String(length=20), server_default="Interne", nullable=False),
        sa.Column("mac_address", sa.String(length=17)),
        sa.Column("status", sa.String(length=20), server_default="Disponible", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("computer_type IN ('Interne', 'Externe')", name="ck_computers_type"),
        sa.CheckConstraint("status IN ('Disponible', 'En cours', 'Maintenance')", name="ck_computers_status"),
    )
    op.create_index("uq_computers_mac_address", "computers", ["mac_address"], unique=True)
    op.create_index("ix_computers_status", "computers", ["status"])

    op.create_table(
        "cafe_sessions",
        sa.Column("id", sa.String(length=40), primary_key=True),
        sa.Column("computer_id", sa.String(length=40), sa.ForeignKey("computers.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("client_id", sa.String(length=40), sa.ForeignKey("clients.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True)),
        sa.Column("planned_hours", sa.Numeric(8, 2)),
        sa.Column("status", sa.String(length=20), server_default="En cours", nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), server_default="0", nullable=False),
        sa.Column("notes", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("status IN ('En cours', 'Terminée')", name="ck_cafe_sessions_status"),
        sa.CheckConstraint("planned_hours IS NULL OR planned_hours > 0", name="ck_cafe_sessions_planned_hours"),
        sa.CheckConstraint("amount >= 0", name="ck_cafe_sessions_amount"),
    )
    op.create_index("ix_cafe_sessions_computer_id", "cafe_sessions", ["computer_id"])
    op.create_index("ix_cafe_sessions_client_id", "cafe_sessions", ["client_id"])
    op.create_index("ix_cafe_sessions_status", "cafe_sessions", ["status"])
    op.create_index("ix_cafe_sessions_started_at", "cafe_sessions", ["started_at"])

    op.create_table(
        "payments",
        sa.Column("id", sa.String(length=40), primary_key=True),
        sa.Column("session_id", sa.String(length=40), sa.ForeignKey("cafe_sessions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("client_id", sa.String(length=40), sa.ForeignKey("clients.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("method", sa.String(length=30), nullable=False),
        sa.Column("paid_at", sa.DateTime(timezone=True)),
        sa.Column("status", sa.String(length=20), server_default="En attente", nullable=False),
        sa.Column("reference", sa.String(length=120)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("method IN ('Espèces', 'Mobile Money', 'Carte')", name="ck_payments_method"),
        sa.CheckConstraint("status IN ('Payé', 'En attente')", name="ck_payments_status"),
        sa.CheckConstraint("amount >= 0", name="ck_payments_amount"),
    )
    op.create_index("ix_payments_session_id", "payments", ["session_id"])
    op.create_index("ix_payments_client_id", "payments", ["client_id"])
    op.create_index("ix_payments_status", "payments", ["status"])
    op.create_index("ix_payments_paid_at", "payments", ["paid_at"])

    op.create_table(
        "app_settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("cafe_name", sa.String(length=160), server_default="Cyber Café Central", nullable=False),
        sa.Column("hourly_rate", sa.Numeric(12, 2), server_default="1200", nullable=False),
        sa.Column("currency", sa.String(length=8), server_default="Ar", nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("id = 1", name="ck_app_settings_singleton"),
        sa.CheckConstraint("hourly_rate >= 0", name="ck_app_settings_hourly_rate"),
    )
    op.bulk_insert(
        sa.table(
            "app_settings",
            sa.column("id", sa.Integer),
            sa.column("cafe_name", sa.String),
            sa.column("hourly_rate", sa.Numeric),
            sa.column("currency", sa.String),
        ),
        [{"id": 1, "cafe_name": "Cyber Café Central", "hourly_rate": 1200, "currency": "Ar"}],
    )


def downgrade() -> None:
    op.drop_table("app_settings")
    op.drop_index("ix_payments_paid_at", table_name="payments")
    op.drop_index("ix_payments_status", table_name="payments")
    op.drop_index("ix_payments_client_id", table_name="payments")
    op.drop_index("ix_payments_session_id", table_name="payments")
    op.drop_table("payments")
    op.drop_index("ix_cafe_sessions_started_at", table_name="cafe_sessions")
    op.drop_index("ix_cafe_sessions_status", table_name="cafe_sessions")
    op.drop_index("ix_cafe_sessions_client_id", table_name="cafe_sessions")
    op.drop_index("ix_cafe_sessions_computer_id", table_name="cafe_sessions")
    op.drop_table("cafe_sessions")
    op.drop_index("ix_computers_status", table_name="computers")
    op.drop_table("computers")
    op.drop_index("ix_clients_email", table_name="clients")
    op.drop_index("ix_clients_name", table_name="clients")
    op.drop_table("clients")
    op.drop_table("users")
