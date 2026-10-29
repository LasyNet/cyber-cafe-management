"""Validation tests for business API payload schemas."""

import pytest
from pydantic import ValidationError

from app.schemas.business import ClientCreate, ComputerCreate, PaymentCreate, SessionCreate


def test_client_name_is_trimmed_and_required() -> None:
    assert ClientCreate(name="  Mara  ").name == "Mara"
    with pytest.raises(ValidationError):
        ClientCreate(name="  ")


def test_computer_type_is_limited_to_supported_values() -> None:
    assert ComputerCreate(name="Station 01", computer_type="Interne").computer_type == "Interne"
    with pytest.raises(ValidationError):
        ComputerCreate(name="Station 01", computer_type="Portable")


def test_session_rejects_non_positive_planned_hours() -> None:
    with pytest.raises(ValidationError):
        SessionCreate(computer_id="PC-1", client_id="CL-1", planned_hours=0)


def test_payment_rejects_negative_amount() -> None:
    with pytest.raises(ValidationError):
        PaymentCreate(session_id="SES-1", client_id="CL-1", amount=-1, method="Espèces")
