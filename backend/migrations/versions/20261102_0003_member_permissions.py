"""Add per-company, per-member permission overrides.

Revision ID: 20261102_0003
Revises: 20261102_0002
"""

from alembic import op
import sqlalchemy as sa

revision = "20261102_0003"
down_revision = "20261102_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "company_members",
        sa.Column(
            "permissions",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'{}'"),
        ),
    )


def downgrade() -> None:
    op.drop_column("company_members", "permissions")
