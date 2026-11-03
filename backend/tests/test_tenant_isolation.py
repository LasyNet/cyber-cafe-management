"""HTTP-level checks for company isolation and active workspace selection."""

from collections.abc import Generator

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.core.config import get_settings
from app.core.security import create_access_token, hash_password
from app.db.base import Base
from app.main import create_app
from app.models import Client, Company, CompanyMember, User


def test_business_data_is_isolated_by_active_company() -> None:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    test_sessions = sessionmaker(bind=engine, autoflush=False, autocommit=False, class_=Session)

    with test_sessions() as db:
        user = User(
            id="USR-TENANT-TEST",
            full_name="Tenant Admin",
            email="tenant@example.com",
            password_hash=hash_password("VeryStrongPassword123"),
            role="admin",
            is_active=True,
        )
        company_a = Company(
            id="CMP-TENANT-A",
            name="Cyber A",
            slug="cyber-a",
            created_by=user.id,
        )
        company_b = Company(
            id="CMP-TENANT-B",
            name="Cyber B",
            slug="cyber-b",
            created_by=user.id,
        )
        company_c = Company(
            id="CMP-TENANT-C",
            name="Cyber C",
            slug="cyber-c",
        )
        db.add_all([user, company_a, company_b, company_c])
        db.flush()
        db.add_all(
            [
                CompanyMember(user_id=user.id, company_id=company_a.id, role="admin"),
                CompanyMember(user_id=user.id, company_id=company_b.id, role="employee"),
                Client(id="CL-TENANT-A", company_id=company_a.id, name="Client A"),
                Client(id="CL-TENANT-B", company_id=company_b.id, name="Client B"),
            ]
        )
        db.commit()

    def override_get_db() -> Generator[Session, None, None]:
        with test_sessions() as db:
            yield db

    app = create_app()
    app.dependency_overrides[get_db] = override_get_db
    settings = get_settings()
    token = create_access_token(
        user_id="USR-TENANT-TEST",
        role="admin",
        secret_key=settings.auth_secret_key,
    )

    try:
        with TestClient(app) as client:
            headers = {"Authorization": f"Bearer {token}"}
            missing_selection = client.get("/api/v1/clients", headers=headers)
            assert missing_selection.status_code == 409

            company_a_response = client.get(
                "/api/v1/clients",
                headers={**headers, "X-Company-ID": "CMP-TENANT-A"},
            )
            assert company_a_response.status_code == 200
            assert [item["name"] for item in company_a_response.json()] == ["Client A"]

            company_b_response = client.get(
                "/api/v1/clients",
                headers={**headers, "X-Company-ID": "CMP-TENANT-B"},
            )
            assert company_b_response.status_code == 200
            assert [item["name"] for item in company_b_response.json()] == ["Client B"]

            created_client = client.post(
                "/api/v1/clients",
                headers={**headers, "X-Company-ID": "CMP-TENANT-B"},
                json={"name": "Client B2"},
            )
            assert created_client.status_code == 201
            assert created_client.json()["name"] == "Client B2"

            foreign_company = client.get(
                "/api/v1/clients",
                headers={**headers, "X-Company-ID": "CMP-TENANT-C"},
            )
            assert foreign_company.status_code == 403

            foreign_resource = client.get(
                "/api/v1/clients/CL-TENANT-B",
                headers={**headers, "X-Company-ID": "CMP-TENANT-A"},
            )
            assert foreign_resource.status_code == 404

            employee_settings = client.patch(
                "/api/v1/settings",
                headers={**headers, "X-Company-ID": "CMP-TENANT-B"},
                json={"cafe_name": "Unauthorized Change"},
            )
            assert employee_settings.status_code == 403

            admin_settings = client.patch(
                "/api/v1/settings",
                headers={**headers, "X-Company-ID": "CMP-TENANT-A"},
                json={"cafe_name": "Cyber A Updated"},
            )
            assert admin_settings.status_code == 200
            assert admin_settings.json()["cafe_name"] == "Cyber A Updated"
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(engine)
        engine.dispose()


def test_employee_permissions_are_enforced_and_customizable() -> None:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    test_sessions = sessionmaker(bind=engine, autoflush=False, autocommit=False, class_=Session)
    with test_sessions() as db:
        admin = User(
            id="USR-PERM-ADMIN",
            full_name="Permission Admin",
            email="permission-admin@example.com",
            password_hash=hash_password("VeryStrongPassword123"),
            role="admin",
            is_active=True,
        )
        employee = User(
            id="USR-PERM-EMPLOYEE",
            full_name="Permission Employee",
            email="permission-employee@example.com",
            password_hash=hash_password("VeryStrongPassword123"),
            role="employee",
            is_active=True,
        )
        company = Company(
            id="CMP-PERMISSIONS",
            name="Permissions Café",
            slug="permissions-cafe",
            created_by=admin.id,
        )
        db.add_all([admin, employee, company])
        db.flush()
        db.add_all(
            [
                CompanyMember(user_id=admin.id, company_id=company.id, role="admin"),
                CompanyMember(user_id=employee.id, company_id=company.id, role="employee"),
                Client(id="CL-PERM-DELETE", company_id=company.id, name="Protected Client"),
            ]
        )
        db.commit()

    def override_get_db() -> Generator[Session, None, None]:
        with test_sessions() as db:
            yield db

    app = create_app()
    app.dependency_overrides[get_db] = override_get_db
    settings = get_settings()
    admin_token = create_access_token(
        user_id="USR-PERM-ADMIN",
        role="admin",
        secret_key=settings.auth_secret_key,
    )
    employee_token = create_access_token(
        user_id="USR-PERM-EMPLOYEE",
        role="employee",
        secret_key=settings.auth_secret_key,
    )
    admin_headers = {
        "Authorization": f"Bearer {admin_token}",
        "X-Company-ID": "CMP-PERMISSIONS",
    }
    employee_headers = {
        "Authorization": f"Bearer {employee_token}",
        "X-Company-ID": "CMP-PERMISSIONS",
    }

    try:
        with TestClient(app) as client:
            employee_access = client.get("/api/v1/companies/access", headers=employee_headers)
            assert employee_access.status_code == 200
            assert employee_access.json()["permissions"]["clients.read"] is True
            assert employee_access.json()["permissions"]["computers.create"] is False
            assert client.get("/api/v1/clients", headers=employee_headers).status_code == 200
            assert client.post(
                "/api/v1/computers",
                headers=employee_headers,
                json={
                    "name": "Restricted PC",
                    "computer_type": "Interne",
                    "mac_address": "00:11:22:33:44:55",
                    "status": "Disponible",
                },
            ).status_code == 403
            assert client.delete(
                "/api/v1/clients/CL-PERM-DELETE", headers=employee_headers
            ).status_code == 403
            assert client.patch(
                "/api/v1/settings",
                headers=employee_headers,
                json={"cafe_name": "Forbidden"},
            ).status_code == 403

            admin_access = client.get("/api/v1/companies/access", headers=admin_headers)
            assert admin_access.status_code == 200
            assert all(admin_access.json()["permissions"].values())

            customized = client.patch(
                "/api/v1/companies/members/USR-PERM-EMPLOYEE",
                headers=admin_headers,
                json={"permissions": {"clients.delete": True}},
            )
            assert customized.status_code == 200
            assert customized.json()["permissions"]["clients.delete"] is True
            assert client.delete(
                "/api/v1/clients/CL-PERM-DELETE", headers=employee_headers
            ).status_code == 204

            revoked = client.patch(
                "/api/v1/companies/members/USR-PERM-EMPLOYEE",
                headers=admin_headers,
                json={"permissions": {"clients.delete": False}},
            )
            assert revoked.status_code == 200
            assert client.delete(
                "/api/v1/clients/CL-PERM-DELETE", headers=employee_headers
            ).status_code == 403

            unknown_permission = client.patch(
                "/api/v1/companies/members/USR-PERM-EMPLOYEE",
                headers=admin_headers,
                json={"permissions": {"root.access": True}},
            )
            assert unknown_permission.status_code == 422
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(engine)
        engine.dispose()
