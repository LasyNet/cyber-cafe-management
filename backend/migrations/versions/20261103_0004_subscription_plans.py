"""Add Free and Premium subscriptions with manual upgrade requests.

Revision ID: 20261103_0004
Revises: 20261102_0003
"""

from alembic import op
import sqlalchemy as sa

revision = "20261103_0004"
down_revision = "20261102_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "companies",
        sa.Column("plan", sa.String(length=20), server_default="free", nullable=False),
    )
    op.add_column(
        "companies",
        sa.Column(
            "subscription_status",
            sa.String(length=20),
            server_default="active",
            nullable=False,
        ),
    )
    op.add_column(
        "companies",
        sa.Column("subscription_started_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "companies",
        sa.Column("subscription_expires_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_check_constraint("ck_companies_plan", "companies", "plan IN ('free', 'premium')")
    op.create_check_constraint(
        "ck_companies_subscription_status",
        "companies",
        "subscription_status IN ('active', 'expired', 'cancelled')",
    )

    op.create_table(
        "subscription_requests",
        sa.Column("id", sa.String(length=40), primary_key=True),
        sa.Column("company_id", sa.String(length=40), nullable=False),
        sa.Column("requested_by", sa.String(length=40), nullable=False),
        sa.Column("status", sa.String(length=20), server_default="pending", nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("reviewed_by", sa.String(length=40), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_days", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "status IN ('pending', 'approved', 'rejected')",
            name="ck_subscription_requests_status",
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["requested_by"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["reviewed_by"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index(
        "ix_subscription_requests_company_status",
        "subscription_requests",
        ["company_id", "status"],
    )


def downgrade() -> None:
    op.drop_index("ix_subscription_requests_company_status", table_name="subscription_requests")
    op.drop_table("subscription_requests")
    op.drop_constraint("ck_companies_subscription_status", "companies", type_="check")
    op.drop_constraint("ck_companies_plan", "companies", type_="check")
    op.drop_column("companies", "subscription_expires_at")
    op.drop_column("companies", "subscription_started_at")
    op.drop_column("companies", "subscription_status")
    op.drop_column("companies", "plan")
