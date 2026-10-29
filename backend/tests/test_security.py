"""Tests for password hashing and access-token validation."""

import pytest
from fastapi import HTTPException

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_password_hash_is_salted_and_verifiable() -> None:
    first = hash_password("very-secure-password")
    second = hash_password("very-secure-password")
    assert first != second
    assert verify_password("very-secure-password", first)
    assert not verify_password("incorrect-password", first)


def test_password_hash_requires_minimum_length() -> None:
    with pytest.raises(ValueError):
        hash_password("short")


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
