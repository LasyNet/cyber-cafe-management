"""Add company-scoped permission overrides to memberships.

Revision ID: 20261103_0003
Revises: 20261102_0002
"""

from alembic import op
import sqlalchemy as sa

revision = "20261103_0003"
down_revision = "20261102_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Keep existing memberships valid: an empty object means use the employee
    # permission defaults defined by the application.
    op.add_column(
        "company_members",
        sa.Column(
            "permissions",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'{}'"),
        ),
    )
    op.alter_column("company_members", "permissions", server_default=None)


def downgrade() -> None:
    op.drop_column("company_members", "permissions")
