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


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserRead(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    full_name: str
    email: str
    role: str
    is_active: bool
