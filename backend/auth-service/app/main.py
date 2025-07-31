# app/main.py

from fastapi import FastAPI
from app.db.database import engine, Base # Importe le moteur de la base de données et la base déclarative
from app.api.v1.endpoints import auth # Importe le routeur d'authentification
from app.core.config import settings # Importe les paramètres de configuration

# Crée une instance de l'application FastAPI
app = FastAPI(
    title="Service d'Authentification du Cyber Café", # Titre de l'API pour la documentation
    description="Microservice pour la gestion de l'authentification et des utilisateurs (gérants, administrateurs)", # Description de l'API
    version="1.0.0", # Version de l'API
    docs_url="/docs", # URL pour la documentation interactive (Swagger UI)
    redoc_url="/redoc" # URL pour la documentation alternative (ReDoc)
)

# Fonction de démarrage de l'application FastAPI
# Cette fonction est exécutée au démarrage du service
@app.on_event("startup")
def on_startup():
    # Crée toutes les tables de la base de données si elles n'existent pas déjà.
    # C'est très utile pour le développement. En production, il est recommandé d'utiliser
    # un outil de migration de base de données comme Alembic pour gérer les schémas.
    Base.metadata.create_all(bind=engine)
    print("Les tables de la base de données ont été créées/vérifiées.")

# Inclut les routes de l'API d'authentification définies dans app/api/v1/endpoints/auth.py
# Toutes les routes de ce routeur seront préfixées par "/auth"
# et regroupées sous le tag "Authentification" dans la documentation.
app.include_router(auth.router, prefix="/auth", tags=["Authentification"])

# Route racine pour vérifier que le service est en marche
@app.get("/")
def read_root():
    """
    Endpoint simple pour vérifier que le service d'authentification est en cours d'exécution.
    """
    return {"message": "Le Service d'Authentification est en cours d'exécution !"}
