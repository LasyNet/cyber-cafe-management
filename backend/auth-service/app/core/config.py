"""Validated runtime configuration for the authentication service."""
import os

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, gt=0)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @model_validator(mode="after")
    def validate_security_settings(self):
        if self.ALGORITHM != "HS256":
            raise ValueError("ALGORITHM must be HS256 for this service configuration.")

        environment = os.getenv("ENVIRONMENT", "development").strip().lower()
        placeholders = {
            "", "votre_super_cle_secrete_et_longue_pour_jwt",
            "your-super-secret-jwt-key-change-in-production",
            "changeme", "change-me", "change_me_setup_env",
        }
        if environment in {"production", "prod"}:
            if self.SECRET_KEY.strip().lower() in placeholders:
                raise ValueError("SECRET_KEY must be replaced with a unique production secret.")
            if len(self.SECRET_KEY.encode("utf-8")) < 32:
                raise ValueError("SECRET_KEY must contain at least 32 bytes in production.")

        if not self.DATABASE_URL.strip():
            raise ValueError("DATABASE_URL must not be empty.")
        return self


settings = Settings()
