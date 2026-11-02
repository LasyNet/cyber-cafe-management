"""Introduce the first safe multi-company schema.

Revision ID: 20261102_0002
Revises: 20261029_0001
"""

from alembic import op
import sqlalchemy as sa

revision = "20261102_0002"
down_revision = "20261029_0001"
branch_labels = None
depends_on = None

LEGACY_COMPANY_ID = "CMP-LEGACY"


def upgrade() -> None:
    # The legacy workspace is created before adding tenant references so every
    # existing business record can be assigned without being deleted or recreated.
    op.create_table(
        "companies",
        sa.Column("id", sa.String(length=40), primary_key=True),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("slug", sa.String(length=180), nullable=False),
        sa.Column("created_by", sa.String(length=40), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("slug", name="uq_companies_slug"),
    )
    op.execute(
        sa.text(
            """
            INSERT INTO companies (id, name, slug, created_by, is_active)
            SELECT
                :company_id,
                COALESCE(
                    (SELECT cafe_name FROM app_settings ORDER BY id LIMIT 1),
                    'Cyber Café Central'
                ),
                'legacy-cyber-cafe',
                (SELECT id FROM users ORDER BY created_at, id LIMIT 1),
                TRUE
            """
        ).bindparams(company_id=LEGACY_COMPANY_ID)
    )

    op.create_table(
        "company_members",
        sa.Column("user_id", sa.String(length=40), nullable=False),
        sa.Column("company_id", sa.String(length=40), nullable=False),
        sa.Column("role", sa.String(length=20), server_default="employee", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("role IN ('admin', 'employee')", name="ck_company_members_role"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "company_id"),
    )
    op.create_index("ix_company_members_company_id", "company_members", ["company_id"])
    op.execute(
        sa.text(
            """
            INSERT INTO company_members (user_id, company_id, role, is_active)
            SELECT id, :company_id, role, is_active FROM users
            """
        ).bindparams(company_id=LEGACY_COMPANY_ID)
    )

    op.create_table(
        "invitations",
        sa.Column("id", sa.String(length=40), primary_key=True),
        sa.Column("company_id", sa.String(length=40), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=True),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("role", sa.String(length=20), server_default="employee", nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", sa.String(length=40), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("role IN ('admin', 'employee')", name="ck_invitations_role"),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("token_hash", name="uq_invitations_token_hash"),
    )
    op.create_index("ix_invitations_company_id", "invitations", ["company_id"])
    op.create_index("ix_invitations_expires_at", "invitations", ["expires_at"])

    tenant_tables = ("clients", "computers", "cafe_sessions", "payments", "app_settings")
    for table_name in tenant_tables:
        op.add_column(table_name, sa.Column("company_id", sa.String(length=40), nullable=True))
        op.execute(
            sa.text(f"UPDATE {table_name} SET company_id = :company_id").bindparams(
                company_id=LEGACY_COMPANY_ID
            )
        )
        op.alter_column(table_name, "company_id", nullable=False)
        ondelete = "CASCADE" if table_name == "app_settings" else "RESTRICT"
        op.create_foreign_key(
            f"fk_{table_name}_company_id_companies",
            table_name,
            "companies",
            ["company_id"],
            ["id"],
            ondelete=ondelete,
        )
        op.create_index(
            f"ix_{table_name}_company_id",
            table_name,
            ["company_id"],
        )

    # A computer MAC address only needs to be unique inside its own company.
    op.drop_index("uq_computers_mac_address", table_name="computers")
    op.create_index(
        "uq_computers_company_mac_address",
        "computers",
        ["company_id", "mac_address"],
        unique=True,
    )

    # Settings become one-per-company instead of one global singleton.
    op.drop_constraint("ck_app_settings_singleton", "app_settings", type_="check")
    op.create_unique_constraint(
        "uq_app_settings_company_id", "app_settings", ["company_id"]
    )
    op.execute(
        sa.text(
            "SELECT setval(pg_get_serial_sequence('app_settings', 'id'), "
            "COALESCE((SELECT MAX(id) FROM app_settings), 1))"
        )
    )


def downgrade() -> None:
    bind = op.get_bind()

    # Refuse a downgrade that would silently discard tenant membership or data.
    extra_companies = bind.execute(
        sa.text("SELECT COUNT(*) FROM companies WHERE id <> :legacy_id"),
        {"legacy_id": LEGACY_COMPANY_ID},
    ).scalar_one()
    invitations = bind.execute(sa.text("SELECT COUNT(*) FROM invitations")).scalar_one()
    mismatched_memberships = bind.execute(
        sa.text(
            """
            SELECT COUNT(*)
            FROM company_members AS member
            JOIN users ON users.id = member.user_id
            WHERE member.company_id = :legacy_id
              AND member.role <> users.role
            """
        ),
        {"legacy_id": LEGACY_COMPANY_ID},
    ).scalar_one()
    membership_count = bind.execute(
        sa.text("SELECT COUNT(*) FROM company_members WHERE company_id = :legacy_id"),
        {"legacy_id": LEGACY_COMPANY_ID},
    ).scalar_one()
    user_count = bind.execute(sa.text("SELECT COUNT(*) FROM users")).scalar_one()
    settings_count = bind.execute(sa.text("SELECT COUNT(*) FROM app_settings")).scalar_one()
    invalid_settings = bind.execute(
        sa.text("SELECT COUNT(*) FROM app_settings WHERE id <> 1")
    ).scalar_one()

    if (
        extra_companies
        or invitations
        or mismatched_memberships
        or membership_count != user_count
        or settings_count > 1
        or invalid_settings
    ):
        raise RuntimeError(
            "Downgrade refused: multi-company data exists. Export and reconcile tenant "
            "data before attempting to downgrade."
        )

    op.drop_constraint("uq_app_settings_company_id", "app_settings", type_="unique")
    op.create_check_constraint("ck_app_settings_singleton", "app_settings", "id = 1")

    op.drop_index("uq_computers_company_mac_address", table_name="computers")
    op.create_index(
        "uq_computers_mac_address", "computers", ["mac_address"], unique=True
    )

    for table_name in reversed(("clients", "computers", "cafe_sessions", "payments", "app_settings")):
        op.drop_index(f"ix_{table_name}_company_id", table_name=table_name)
        op.drop_constraint(
            f"fk_{table_name}_company_id_companies", table_name, type_="foreignkey"
        )
        op.drop_column(table_name, "company_id")

    op.drop_index("ix_invitations_expires_at", table_name="invitations")
    op.drop_index("ix_invitations_company_id", table_name="invitations")
    op.drop_table("invitations")
    op.drop_index("ix_company_members_company_id", table_name="company_members")
    op.drop_table("company_members")
    op.drop_table("companies")
