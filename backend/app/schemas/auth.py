"""Authentication request and response schemas."""

from pydantic import BaseModel, Field, field_validator


class LoginRequest(BaseModel):
    """Credentials submitted to the login endpoint."""

    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=256)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip()


class RegisterRequest(BaseModel):
    """Public registration payload; the API decides the account role."""

    full_name: str = Field(min_length=2, max_length=160)
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=12, max_length=256)
    invite_token: str | None = Field(default=None, min_length=20, max_length=256)

    @field_validator("full_name")
    @classmethod
    def normalize_full_name(cls, value: str) -> str:
        normalized = " ".join(value.split())
        if len(normalized) < 2:
            raise ValueError("Le nom complet doit contenir au moins 2 caractères.")
        return normalized

    @field_validator("email")
    @classmethod
    def normalize_registration_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized.count("@") != 1 or "." not in normalized.rsplit("@", 1)[-1]:
            raise ValueError("Adresse e-mail invalide.")
        return normalized


class TokenResponse(BaseModel):
    """Browser session response; the bearer token is only sent in an HttpOnly cookie."""

    expires_in: int


class UserRead(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    full_name: str
    email: str
    role: str
    is_active: bool
