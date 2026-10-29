"""Small standard-library security helpers for password hashes and signed JWTs."""

import base64
import hashlib
import hmac
import json
import secrets
import time
from typing import Any

from fastapi import HTTPException, status

PBKDF2_ITERATIONS = 310_000
TOKEN_TTL_SECONDS = 60 * 60


def hash_password(password: str) -> str:
    """Hash a password using PBKDF2-HMAC-SHA256 and a random per-password salt."""
    if len(password) < 12:
        raise ValueError("Le mot de passe doit contenir au moins 12 caractères.")
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${_b64encode(salt)}${_b64encode(digest)}"


def verify_password(password: str, encoded_hash: str) -> bool:
    """Compare a password with a stored PBKDF2 hash without timing-sensitive equality."""
    try:
        algorithm, iterations, salt, expected = encoded_hash.split("$", maxsplit=3)
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(), _b64decode(salt), int(iterations))
        return hmac.compare_digest(_b64encode(digest), expected)
    except (ValueError, TypeError):
        return False


def create_access_token(*, user_id: str, role: str, secret_key: str) -> str:
    """Create a short-lived HS256 JWT without storing session state."""
    now = int(time.time())
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {"sub": user_id, "role": role, "iat": now, "exp": now + TOKEN_TTL_SECONDS}
    signing_input = f"{_b64encode_json(header)}.{_b64encode_json(payload)}"
    signature = hmac.new(secret_key.encode(), signing_input.encode(), hashlib.sha256).digest()
    return f"{signing_input}.{_b64encode(signature)}"


def decode_access_token(token: str, secret_key: str) -> dict[str, Any]:
    """Validate a signed, unexpired HS256 JWT and return its claims."""
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentification requise ou jeton invalide.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        encoded_header, encoded_payload, encoded_signature = token.split(".")
        signing_input = f"{encoded_header}.{encoded_payload}"
        expected = hmac.new(secret_key.encode(), signing_input.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(_b64encode(expected), encoded_signature):
            raise unauthorized
        header = json.loads(_b64decode(encoded_header))
        claims = json.loads(_b64decode(encoded_payload))
        if (header.get("alg") != "HS256" or header.get("typ") != "JWT"
            or not isinstance(claims.get("sub"), str)
            or claims.get("role") not in {"admin", "employee"}
            or not isinstance(claims.get("exp"), int) or claims["exp"] <= int(time.time())):
            raise unauthorized
        return claims
    except HTTPException:
        raise
    except (ValueError, TypeError, json.JSONDecodeError) as exc:
        raise unauthorized from exc


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _b64decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def _b64encode_json(value: dict[str, Any]) -> str:
    return _b64encode(json.dumps(value, separators=(",", ":"), sort_keys=True).encode())
