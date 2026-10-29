"""Request and response schemas for persisted cyber-café resources."""

from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints
from typing_extensions import Annotated

NonEmpty = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
ComputerType = Literal["Interne", "Externe"]
ComputerStatus = Literal["Disponible", "En cours", "Maintenance"]
SessionStatus = Literal["En cours", "Terminée"]
PaymentMethod = Literal["Espèces", "Mobile Money", "Carte"]
PaymentStatus = Literal["Payé", "En attente"]


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class ClientCreate(BaseModel):
    name: NonEmpty
    phone: str | None = None
    email: str | None = None


class ClientUpdate(BaseModel):
    name: NonEmpty | None = None
    phone: str | None = None
    email: str | None = None


class ClientRead(ORMModel):
    id: str
    name: str
    phone: str | None
    email: str | None
    created_at: datetime
    updated_at: datetime


class ComputerCreate(BaseModel):
    name: NonEmpty
    computer_type: ComputerType = "Interne"
    mac_address: str | None = None
    status: ComputerStatus = "Disponible"


class ComputerUpdate(BaseModel):
    name: NonEmpty | None = None
    computer_type: ComputerType | None = None
    mac_address: str | None = None
    status: ComputerStatus | None = None


class ComputerRead(ORMModel):
    id: str
    name: str
    computer_type: str
    mac_address: str | None
    status: str
    created_at: datetime
    updated_at: datetime


class SessionCreate(BaseModel):
    computer_id: NonEmpty
    client_id: NonEmpty
    planned_hours: Decimal | None = Field(default=None, gt=0, max_digits=8, decimal_places=2)
    amount: Decimal = Field(default=Decimal("0"), ge=0, max_digits=12, decimal_places=2)
    notes: str | None = None


class SessionUpdate(BaseModel):
    planned_hours: Decimal | None = Field(default=None, gt=0, max_digits=8, decimal_places=2)
    amount: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    notes: str | None = None
    status: SessionStatus | None = None
    ended_at: datetime | None = None


class SessionRead(ORMModel):
    id: str
    computer_id: str
    client_id: str
    started_at: datetime
    ended_at: datetime | None
    planned_hours: Decimal | None
    status: str
    amount: Decimal
    notes: str | None
    created_at: datetime
    updated_at: datetime


class PaymentCreate(BaseModel):
    session_id: NonEmpty
    client_id: NonEmpty
    amount: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    method: PaymentMethod
    status: PaymentStatus = "En attente"
    paid_at: datetime | None = None
    reference: str | None = None


class PaymentUpdate(BaseModel):
    amount: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    method: PaymentMethod | None = None
    status: PaymentStatus | None = None
    paid_at: datetime | None = None
    reference: str | None = None


class PaymentRead(ORMModel):
    id: str
    session_id: str
    client_id: str
    amount: Decimal
    method: str
    paid_at: datetime | None
    status: str
    reference: str | None
    created_at: datetime


class SettingsUpdate(BaseModel):
    cafe_name: NonEmpty | None = None
    hourly_rate: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    currency: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=8)] | None = None


class SettingsRead(ORMModel):
    id: int
    cafe_name: str
    hourly_rate: Decimal
    currency: str
    updated_at: datetime
