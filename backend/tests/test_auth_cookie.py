"""Regression tests for browser-cookie authentication and CSRF origin checks."""

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.api.v1.endpoints.auth import _login_failures
from app.core.security import hash_password
from app.db.base import Base
from app.main import create_app
from app.models import Company, CompanyMember, User

TRUSTED_ORIGIN = "http://localhost:5173"


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    test_sessions = sessionmaker(bind=engine, autoflush=False, autocommit=False, class_=Session)

    with test_sessions() as db:
        user = User(
            full_name="Test Admin",
            email="admin@example.com",
            password_hash=hash_password("VeryStrongPassword123"),
            role="admin",
            is_active=True,
        )
        db.add(user)
        db.flush()
        company = Company(
            id="CMP-LEGACY",
            name="Cyber Café Central",
            slug="legacy-cyber-cafe",
            created_by=user.id,
        )
        db.add(company)
        db.add(
            CompanyMember(
                user_id=user.id,
                company_id=company.id,
                role="admin",
                is_active=True,
            )
        )
        db.commit()

    def override_get_db() -> Generator[Session, None, None]:
        with test_sessions() as db:
            yield db

    app = create_app()
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def empty_client() -> Generator[TestClient, None, None]:
    """Provide an empty database to exercise the one-time administrator bootstrap."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    test_sessions = sessionmaker(bind=engine, autoflush=False, autocommit=False, class_=Session)

    def override_get_db() -> Generator[Session, None, None]:
        with test_sessions() as db:
            yield db

    app = create_app()
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(engine)
    engine.dispose()


def test_login_sets_httponly_cookie_without_exposing_token(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/login",
        headers={"Origin": TRUSTED_ORIGIN},
        json={"email": "admin@example.com", "password": "VeryStrongPassword123"},
    )

    assert response.status_code == 200
    assert "access_token" not in response.json()
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    cookie = response.headers["set-cookie"].lower()
    assert "lasynet_session=" in cookie
    assert "httponly" in cookie
    assert "samesite=lax" in cookie
    assert "path=/api/v1" in cookie
    assert client.get("/api/v1/auth/me").status_code == 200


def test_production_login_cookie_allows_cross_origin_fetch(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app.core.config import get_settings

    monkeypatch.setattr(get_settings(), "app_env", "production")
    response = client.post(
        "/api/v1/auth/login",
        headers={"Origin": TRUSTED_ORIGIN},
        json={"email": "admin@example.com", "password": "VeryStrongPassword123"},
    )

    assert response.status_code == 200
    cookie = response.headers["set-cookie"].lower()
    assert "samesite=none" in cookie
    assert "secure" in cookie
    assert "httponly" in cookie


def test_login_rejects_untrusted_origin(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/login",
        headers={"Origin": "https://attacker.example"},
        json={"email": "admin@example.com", "password": "VeryStrongPassword123"},
    )

    assert response.status_code == 403
    assert "lasynet_session" not in client.cookies


def test_cookie_authenticated_mutation_rejects_untrusted_origin(client: TestClient) -> None:
    login = client.post(
        "/api/v1/auth/login",
        headers={"Origin": TRUSTED_ORIGIN},
        json={"email": "admin@example.com", "password": "VeryStrongPassword123"},
    )
    assert login.status_code == 200

    response = client.patch(
        "/api/v1/settings",
        headers={"Origin": "https://attacker.example"},
        json={"cafe_name": "Compromised"},
    )
    assert response.status_code == 403


def test_logout_clears_session_cookie(client: TestClient) -> None:
    login = client.post(
        "/api/v1/auth/login",
        headers={"Origin": TRUSTED_ORIGIN},
        json={"email": "admin@example.com", "password": "VeryStrongPassword123"},
    )
    assert login.status_code == 200
    assert client.get("/api/v1/auth/me").status_code == 200

    response = client.post("/api/v1/auth/logout", headers={"Origin": TRUSTED_ORIGIN})

    assert response.status_code == 204
    assert client.get("/api/v1/auth/me").status_code == 401


def test_login_rate_limit_blocks_repeated_failures(client: TestClient) -> None:
    _login_failures.clear()
    for _ in range(10):
        response = client.post(
            "/api/v1/auth/login",
            headers={"Origin": TRUSTED_ORIGIN},
            json={"email": "missing@example.com", "password": "wrong-password"},
        )
        assert response.status_code == 401

    limited = client.post(
        "/api/v1/auth/login",
        headers={"Origin": TRUSTED_ORIGIN},
        json={"email": "missing@example.com", "password": "wrong-password"},
    )
    assert limited.status_code == 429
    assert "retry-after" in limited.headers
    _login_failures.clear()


def test_first_registration_creates_administrator(empty_client: TestClient) -> None:
    response = empty_client.post(
        "/api/v1/auth/register",
        headers={"Origin": TRUSTED_ORIGIN},
        json={
            "full_name": "First Administrator",
            "email": "FIRST@example.com",
            "password": "StrongRegistrationPassword123",
        },
    )

    assert response.status_code == 201
    assert response.json()["email"] == "first@example.com"
    assert response.json()["role"] == "admin"
    assert "password_hash" not in response.json()

    login = empty_client.post(
        "/api/v1/auth/login",
        headers={"Origin": TRUSTED_ORIGIN},
        json={"email": "FIRST@example.com", "password": "StrongRegistrationPassword123"},
    )
    assert login.status_code == 200
    assert empty_client.get("/api/v1/clients").status_code == 200


def test_later_registration_creates_a_free_company(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/register",
        headers={"Origin": TRUSTED_ORIGIN},
        json={
            "full_name": "New Employee",
            "email": "employee@example.com",
            "password": "StrongRegistrationPassword123",
        },
    )

    assert response.status_code == 201
    assert response.json()["role"] == "employee"


def test_legacy_global_invite_code_does_not_grant_platform_admin(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/register",
        headers={"Origin": TRUSTED_ORIGIN},
        json={
            "full_name": "New Employee",
            "email": "employee@example.com",
            "password": "StrongRegistrationPassword123",
            "invite_code": "legacy-shared-code",
        },
    )

    assert response.status_code == 201
    assert response.json()["role"] == "employee"


def test_registration_rejects_short_password(empty_client: TestClient) -> None:
    response = empty_client.post(
        "/api/v1/auth/register",
        headers={"Origin": TRUSTED_ORIGIN},
        json={
            "full_name": "First Administrator",
            "email": "admin@example.com",
            "password": "short",
        },
    )

    assert response.status_code == 422


def test_company_invitation_can_register_and_join_its_company(client: TestClient) -> None:
    login = client.post(
        "/api/v1/auth/login",
        headers={"Origin": TRUSTED_ORIGIN},
        json={"email": "admin@example.com", "password": "VeryStrongPassword123"},
    )
    assert login.status_code == 200

    invitation = client.post(
        "/api/v1/companies/invitations",
        headers={"Origin": TRUSTED_ORIGIN, "X-Company-ID": "CMP-LEGACY"},
        json={"email": "invited@example.com", "role": "employee", "expires_in_days": 7},
    )
    assert invitation.status_code == 201
    invite_token = invitation.json()["invite_token"]

    registration = client.post(
        "/api/v1/auth/register",
        headers={"Origin": TRUSTED_ORIGIN},
        json={
            "full_name": "Invited Employee",
            "email": "invited@example.com",
            "password": "StrongRegistrationPassword123",
            "invite_token": invite_token,
        },
    )
    assert registration.status_code == 201
    assert registration.json()["role"] == "employee"

    employee_login = client.post(
        "/api/v1/auth/login",
        headers={"Origin": TRUSTED_ORIGIN},
        json={"email": "invited@example.com", "password": "StrongRegistrationPassword123"},
    )
    assert employee_login.status_code == 200
    companies = client.get("/api/v1/companies")
    assert companies.status_code == 200
    assert len(companies.json()) == 1
    assert companies.json()[0]["id"] == "CMP-LEGACY"
    assert companies.json()[0]["role"] == "employee"
