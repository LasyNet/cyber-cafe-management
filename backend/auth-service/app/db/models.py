# app/db/models.py

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func # Pour les fonctions SQL comme NOW()
from app.db.database import Base

# Modèle de base de données pour l'utilisateur
class User(Base):
    __tablename__ = "users" # Nom de la table dans la base de données

    id = Column(Integer, primary_key=True, index=True) # Clé primaire, indexée
    username = Column(String, unique=True, index=True, nullable=False) # Nom d'utilisateur unique
    hashed_password = Column(String, nullable=False) # Mot de passe haché
    email = Column(String, unique=True, index=True, nullable=True) # Email, peut être nul
    is_active = Column(Boolean, default=True) # Indique si le compte est actif
    is_admin = Column(Boolean, default=False) # Indique si l'utilisateur est un administrateur
    is_manager = Column(Boolean, default=False) # Indique si l'utilisateur est un gérant
    created_at = Column(DateTime(timezone=True), server_default=func.now()) # Date de création, avec fuseau horaire
    updated_at = Column(DateTime(timezone=True), onupdate=func.now()) # Date de dernière mise à jour, avec fuseau horaire

    def __repr__(self):
        # Représentation de l'objet pour le débogage
        return f"<User(id={self.id}, username='{self.username}', is_admin={self.is_admin}, is_manager={self.is_manager})>"
