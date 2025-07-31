# app/db/database.py

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings # Importe les paramètres de configuration

# Crée le moteur de la base de données en utilisant l'URL de la base de données des paramètres.
# `pool_pre_ping=True` aide à maintenir la connexion active.
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

# Crée une SessionLocal de type `sessionmaker`.
# Chaque instance de SessionLocal sera une session de base de données.
# Elle sera utilisée pour les opérations CRUD.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Déclare la base pour les modèles de la base de données.
# Les modèles de base de données hériteront de cette classe.
Base = declarative_base()

# Dépendance pour obtenir une session de base de données.
# Cette fonction est utilisée par FastAPI pour injecter une session dans les endpoints.
def get_db():
    db = SessionLocal()
    try:
        yield db  # Fournit la session à l'appelant
    finally:
        db.close() # S'assure que la session est fermée après utilisation
