"""HTTP-level checks for protected business endpoints."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_business_endpoints_require_authentication() -> None:
    response = client.get("/api/v1/clients")
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_health_endpoint_remains_public() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
