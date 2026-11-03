"""Add an explicit platform administrator capability.

Revision ID: 20261103_0005
Revises: 20261103_0004
"""

from alembic import op
import sqlalchemy as sa

revision = "20261103_0005"
down_revision = "20261103_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("is_platform_admin", sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    op.execute(
        sa.text(
            """
            UPDATE users
            SET is_platform_admin = TRUE
            WHERE id = (
                SELECT id FROM users ORDER BY created_at, id LIMIT 1
            )
            """
        )
    )


def downgrade() -> None:
    op.drop_column("users", "is_platform_admin")
