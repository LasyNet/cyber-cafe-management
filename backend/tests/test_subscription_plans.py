"""Coverage for Free quotas and manually activated Premium subscriptions."""

from collections.abc import Generator

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.core.config import get_settings
from app.core.security import create_access_token
from app.db.base import Base
from app.main import create_app
from app.models import Client, Company, CompanyMember, Computer, User


def _test_app():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    sessions = sessionmaker(bind=engine, autoflush=False, autocommit=False, class_=Session)

    def override_get_db() -> Generator[Session, None, None]:
        with sessions() as db:
            yield db

    app = create_app()
    app.dependency_overrides[get_db] = override_get_db
    return app, engine, sessions


def test_free_plan_enforces_computer_and_client_quotas() -> None:
    app, engine, sessions = _test_app()
    with sessions() as db:
        user = User(
            id="USR-FREE-QUOTA",
            full_name="Free Owner",
            email="free-owner@example.com",
            password_hash="not-used",
            role="admin",
            is_platform_admin=True,
            is_active=True,
        )
        company = Company(
            id="CMP-FREE-QUOTA",
            name="Free Café",
            slug="free-cafe-quota",
            created_by=user.id,
        )
        db.add_all([user, company])
        db.flush()
        db.add(CompanyMember(user_id=user.id, company_id=company.id, role="admin"))
        db.add_all(
            [
                Computer(
                    id=f"PC-FREE-{index}",
                    company_id=company.id,
                    name=f"Poste {index}",
                    computer_type="Interne",
                    mac_address=f"00:11:22:33:44:{index:02X}",
                    status="Disponible",
                )
                for index in range(1, 6)
            ]
        )
        db.add_all(
            [
                Client(
                    id=f"CL-FREE-{index}",
                    company_id=company.id,
                    name=f"Client {index}",
                )
                for index in range(1, 101)
            ]
        )
        db.commit()

    settings = get_settings()
    token = create_access_token(
        user_id="USR-FREE-QUOTA",
        role="admin",
        secret_key=settings.auth_secret_key,
    )
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Company-ID": "CMP-FREE-QUOTA",
    }
    try:
        with TestClient(app) as client:
            computer_response = client.post(
                "/api/v1/computers",
                headers=headers,
                json={
                    "name": "Poste supplémentaire",
                    "computer_type": "Interne",
                    "mac_address": "00:11:22:33:44:99",
                    "status": "Disponible",
                },
            )
            assert computer_response.status_code == 403
            assert "5 ordinateurs" in computer_response.json()["detail"]

            client_response = client.post(
                "/api/v1/clients",
                headers=headers,
                json={"name": "Client supplémentaire"},
            )
            assert client_response.status_code == 403
            assert "100 clients" in client_response.json()["detail"]
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(engine)
        engine.dispose()


def test_platform_admin_can_manually_activate_premium() -> None:
    app, engine, sessions = _test_app()
    with sessions() as db:
        user = User(
            id="USR-PLAN-ADMIN",
            full_name="Platform Admin",
            email="platform-admin@example.com",
            password_hash="not-used",
            role="admin",
            is_active=True,
        )
        company = Company(
            id="CMP-PLAN-REQUEST",
            name="Upgrade Café",
            slug="upgrade-cafe",
            created_by=user.id,
        )
        db.add_all([user, company])
        db.flush()
        db.add(CompanyMember(user_id=user.id, company_id=company.id, role="admin"))
        db.commit()

    settings = get_settings()
    token = create_access_token(
        user_id="USR-PLAN-ADMIN",
        role="admin",
        secret_key=settings.auth_secret_key,
    )
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Company-ID": "CMP-PLAN-REQUEST",
    }
    try:
        with TestClient(app) as client:
            requested = client.post(
                "/api/v1/companies/subscription/request",
                headers=headers,
                json={"message": "Paiement effectué, référence MVOLA-123"},
            )
            assert requested.status_code == 201
            request_id = requested.json()["id"]

            pending = client.get("/api/v1/platform/subscription-requests", headers=headers)
            assert pending.status_code == 200
            assert pending.json()[0]["company_name"] == "Upgrade Café"

            activated = client.post(
                f"/api/v1/platform/subscription-requests/{request_id}/activate",
                headers=headers,
                json={"duration_days": 30},
            )
            assert activated.status_code == 200
            assert activated.json()["plan"] == "premium"
            assert activated.json()["subscription_status"] == "active"

            plan = client.get("/api/v1/companies/subscription", headers=headers)
            assert plan.status_code == 200
            assert plan.json()["plan"] == "premium"
            assert plan.json()["limits"]["computers"] is None
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(engine)
        engine.dispose()
