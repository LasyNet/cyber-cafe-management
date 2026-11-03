"""Schema contract tests that do not require a live PostgreSQL connection."""

from sqlalchemy.orm import configure_mappers

import app.models  # noqa: F401 — register model metadata
from app.db.base import Base


def test_expected_domain_and_tenant_tables_are_registered() -> None:
    assert set(Base.metadata.tables) == {
        "users",
        "companies",
        "company_members",
        "invitations",
        "clients",
        "computers",
        "cafe_sessions",
        "payments",
        "app_settings",
        "subscription_requests",
    }


def test_orm_relationships_are_configured() -> None:
    configure_mappers()


def test_company_scoped_domain_tables_have_tenant_foreign_keys() -> None:
    for table_name in (
        "clients",
        "computers",
        "cafe_sessions",
        "payments",
        "app_settings",
    ):
        table = Base.metadata.tables[table_name]
        assert table.c.company_id.nullable is False
        assert any(
            foreign_key.column.table.name == "companies"
            for foreign_key in table.c.company_id.foreign_keys
        )


def test_sessions_and_payments_have_required_foreign_keys() -> None:
    sessions = Base.metadata.tables["cafe_sessions"]
    payments = Base.metadata.tables["payments"]

    assert sessions.c.client_id.foreign_keys
    assert sessions.c.computer_id.foreign_keys
    assert payments.c.session_id.foreign_keys
    assert payments.c.client_id.foreign_keys


def test_membership_is_unique_per_user_and_company() -> None:
    memberships = Base.metadata.tables["company_members"]
    assert set(memberships.primary_key.columns.keys()) == {"user_id", "company_id"}
    assert memberships.c.role.nullable is False


def test_invitations_store_a_hash_and_are_company_scoped() -> None:
    invitations = Base.metadata.tables["invitations"]
    assert invitations.c.token_hash.type.length == 64
    assert invitations.c.company_id.foreign_keys
    assert invitations.c.accepted_at.nullable is True
    assert invitations.c.revoked_at.nullable is True


def test_settings_are_unique_per_company_not_global_singletons() -> None:
    settings = Base.metadata.tables["app_settings"]
    assert any(
        constraint.name == "uq_app_settings_company_id" for constraint in settings.constraints
    )
    assert not any(
        constraint.name == "ck_app_settings_singleton" for constraint in settings.constraints
    )


def test_computer_mac_address_uniqueness_is_company_scoped() -> None:
    computers = Base.metadata.tables["computers"]
    index = next(
        index for index in computers.indexes if index.name == "uq_computers_company_mac_address"
    )
    assert index.unique is True
    assert [column.name for column in index.columns] == ["company_id", "mac_address"]
