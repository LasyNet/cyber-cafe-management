"""Schema contract tests that do not require a live PostgreSQL connection."""

import app.models  # noqa: F401 — register model metadata
from app.db.base import Base


def test_expected_domain_tables_are_registered() -> None:
    assert set(Base.metadata.tables) == {
        "users",
        "clients",
        "computers",
        "cafe_sessions",
        "payments",
        "app_settings",
    }


def test_sessions_and_payments_have_required_foreign_keys() -> None:
    sessions = Base.metadata.tables["cafe_sessions"]
    payments = Base.metadata.tables["payments"]

    assert sessions.c.client_id.foreign_keys
    assert sessions.c.computer_id.foreign_keys
    assert payments.c.session_id.foreign_keys
    assert payments.c.client_id.foreign_keys


def test_settings_are_a_singleton_record() -> None:
    settings = Base.metadata.tables["app_settings"]
    assert any(
        constraint.name == "ck_app_settings_singleton"
        for constraint in settings.constraints
    )
