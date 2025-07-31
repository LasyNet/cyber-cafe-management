# app/core/config.py

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

# Classe de configuration qui charge les variables d'environnement
class Settings(BaseSettings):
    # URL de la base de données PostgreSQL
    DATABASE_URL: str

    # Clé secrète pour la signature des tokens JWT
    SECRET_KEY: str

    # Algorithme de signature pour les tokens JWT (ex: HS256)
    ALGORITHM: str

    # Durée de validité du token d'accès en minutes
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # Spécifie le fichier .env à charger.
    # `case_sensitive=True` est recommandé pour les noms de variables d'environnement.
    # `env_file_encoding='utf-8'` assure la compatibilité avec les caractères spéciaux si besoin.
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding='utf-8', extra="ignore")

# Crée une instance des paramètres
settings = Settings()
