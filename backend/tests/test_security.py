"""Tests for password hashing and access-token validation."""

import base64
import hashlib
import hmac
import json
import time

import pytest
from fastapi import HTTPException

from app.core.security import (
    TOKEN_TTL_SECONDS,
    _b64encode,
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def _signed_token(claims: dict, secret: str = "test-secret") -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    encode_json = lambda value: _b64encode(
        json.dumps(value, separators=(",", ":"), sort_keys=True).encode()
    )
    signing_input = f"{encode_json(header)}.{encode_json(claims)}"
    signature = hmac.new(secret.encode(), signing_input.encode(), hashlib.sha256).digest()
    return f"{signing_input}.{_b64encode(signature)}"


def test_password_hash_is_salted_and_verifiable() -> None:
    first = hash_password("very-secure-password")
    second = hash_password("very-secure-password")
    assert first != second
    assert verify_password("very-secure-password", first)
    assert not verify_password("incorrect-password", first)


def test_password_hash_requires_minimum_length() -> None:
    with pytest.raises(ValueError):
        hash_password("short")


@pytest.mark.parametrize("iterations", ["1", "999999999999999999999"])
def test_password_verification_rejects_unsafe_iteration_counts(iterations: str) -> None:
    encoded_hash = f"pbkdf2_sha256${iterations}$c2FsdHNhbHQ$aGFzaA"
    assert not verify_password("any-password", encoded_hash)


def test_access_token_validates_signature_and_claims() -> None:
    token = create_access_token(user_id="USR-123", role="admin", secret_key="test-secret")
    assert decode_access_token(token, "test-secret")["sub"] == "USR-123"
    with pytest.raises(HTTPException) as error:
        decode_access_token(token, "wrong-secret")
    assert error.value.status_code == 401


def test_access_token_rejects_malformed_input() -> None:
    with pytest.raises(HTTPException) as error:
        decode_access_token("not-a-token", "test-secret")
    assert error.value.status_code == 401


@pytest.mark.parametrize(
    "claims",
    [
        {"sub": "USR-123", "role": "admin", "iat": True, "exp": int(time.time()) + 60},
        {
            "sub": "USR-123",
            "role": "admin",
            "iat": int(time.time()) + 3600,
            "exp": int(time.time()) + 7200,
        },
        {
            "sub": "USR-123",
            "role": "admin",
            "iat": int(time.time()),
            "exp": int(time.time()) + TOKEN_TTL_SECONDS + 1,
        },
    ],
)
def test_access_token_rejects_invalid_time_claims(claims: dict) -> None:
    with pytest.raises(HTTPException) as error:
        decode_access_token(_signed_token(claims), "test-secret")
    assert error.value.status_code == 401
