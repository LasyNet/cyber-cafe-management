# app/schemas/user.py

from pydantic import BaseModel, EmailStr, Field
from typing import Optional

# Schéma de base pour un utilisateur
# Contient les champs communs à plusieurs opérations
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50) # Nom d'utilisateur avec contraintes de longueur
    email: Optional[EmailStr] = None # Email optionnel, validé comme un format d'email

# Schéma pour la création d'un utilisateur
# Hérite de UserBase et ajoute le champ 'password'
class UserCreate(UserBase):
    password: str = Field(..., min_length=8) # Mot de passe avec contrainte de longueur minimale

# Schéma pour la mise à jour d'un utilisateur
# Tous les champs sont optionnels pour permettre des mises à jour partielles
class UserUpdate(UserBase):
    password: Optional[str] = Field(None, min_length=8)
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    is_manager: Optional[bool] = None

# Schéma pour la réponse d'un utilisateur (ce que l'API renvoie)
# N'inclut pas le mot de passe haché par sécurité
class UserResponse(UserBase):
    id: int # L'ID de l'utilisateur, généré par la base de données
    is_active: bool
    is_admin: bool
    is_manager: bool

    class Config:
        # Permet à Pydantic de mapper les attributs de l'ORM (SQLAlchemy) aux champs Pydantic.
        # C'est important pour que les objets User de la base de données puissent être convertis.
        from_attributes = True

# Schéma pour la connexion (login)
# Demande un nom d'utilisateur et un mot de passe
class UserLogin(BaseModel):
    username: str
    password: str

# Schéma pour le token JWT (ce que l'API renvoie après un login réussi)
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer" # Indique le type de token, généralement "bearer"

# Schéma pour les données contenues dans le payload du token JWT
# Le 'sub' (subject) est généralement le nom d'utilisateur
class TokenData(BaseModel):
    username: Optional[str] = None
