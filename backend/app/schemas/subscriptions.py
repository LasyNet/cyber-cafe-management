"""Pydantic schemas for subscription requests and plan administration."""

from pydantic import BaseModel, Field


class SubscriptionRequestCreate(BaseModel):
    message: str | None = Field(default=None, max_length=1000)


class SubscriptionActivation(BaseModel):
    duration_days: int = Field(default=30, ge=1, le=365)
