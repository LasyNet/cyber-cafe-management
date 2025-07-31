# app/api/v1/endpoints/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm # Pour gérer les données de formulaire de login
from sqlalchemy.orm import Session # Pour la gestion de la session de base de données

from app.db.database import get_db # Importe la dépendance pour obtenir une session DB
from app.db.models import User # Importe le modèle User
from app.schemas.user import UserCreate, UserResponse, Token, UserLogin # Importe les schémas Pydantic
from app.crud import user as crud_user # Importe les fonctions CRUD pour les utilisateurs
from app.core.security import verify_password, create_access_token, get_current_user_username, get_password_hash # Importe les fonctions de sécurité
from app.core.config import settings # Importe les paramètres de configuration

from datetime import timedelta # Pour gérer la durée de vie des tokens

# Crée un routeur FastAPI pour les endpoints d'authentification
router = APIRouter()

# Route pour l'enregistrement d'un nouvel utilisateur
# Méthode POST, attend un UserCreate et renvoie un UserResponse
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Enregistre un nouvel utilisateur dans le système.
    Vérifie si le nom d'utilisateur ou l'email existe déjà.
    """
    # Vérifie si le nom d'utilisateur est déjà pris
    db_user = crud_user.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered")
    
    # Vérifie si l'email est déjà pris (si fourni)
    if user.email and crud_user.get_user_by_email(db, email=user.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    # Crée l'utilisateur dans la base de données via la fonction CRUD
    return crud_user.create_user(db=db, user=user)

# Route pour la connexion des utilisateurs
# Méthode POST, utilise OAuth2PasswordRequestForm pour les identifiants et renvoie un Token
@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Authentifie un utilisateur et renvoie un token JWT si les identifiants sont valides.
    """
    # Récupère l'utilisateur par son nom d'utilisateur
    user = crud_user.get_user_by_username(db, username=form_data.username)
    
    # Vérifie si l'utilisateur existe et si le mot de passe est correct
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Calcule la date d'expiration du token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Crée le token d'accès JWT
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Route pour obtenir les informations de l'utilisateur courant
# Méthode GET, protégée par JWT (via get_current_user_username) et renvoie un UserResponse
@router.get("/me", response_model=UserResponse)
def read_users_me(current_username: str = Depends(get_current_user_username), db: Session = Depends(get_db)):
    """
    Récupère les informations de l'utilisateur actuellement authentifié.
    Nécessite un token JWT valide dans l'en-tête Authorization.
    """
    user = crud_user.get_user_by_username(db, username=current_username)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

# Route pour créer un utilisateur administrateur (à utiliser avec prudence, peut être retirée après le setup initial)
# Méthode POST, attend un UserCreate et renvoie un UserResponse
@router.post("/create-admin", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_admin_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Crée un nouvel utilisateur avec les rôles administrateur et gérant.
    Cette route est destinée à la configuration initiale et devrait être sécurisée ou retirée en production.
    """
    db_user = crud_user.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered")
    
    # Crée l'utilisateur avec le rôle admin et gérant
    hashed_password = get_password_hash(user.password)
    new_admin_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        is_active=True,
        is_admin=True,
        is_manager=True # Un admin peut aussi être gérant
    )
    db.add(new_admin_user)
    db.commit()
    db.refresh(new_admin_user)
    return new_admin_user

# --- Routes supplémentaires (à implémenter si nécessaire, avec gestion des permissions) ---
# Route pour mettre à jour un utilisateur (admin ou gérant seulement)
# @router.put("/users/{user_id}", response_model=UserResponse)
# def update_existing_user(
#     user_id: int,
#     user_update: UserUpdate,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_active_admin_or_manager_user) # Dépendance pour vérifier les rôles
# ):
#     db_user = crud_user.get_user(db, user_id=user_id)
#     if not db_user:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
#     return crud_user.update_user(db=db, db_user=db_user, user_update=user_update)

# Route pour supprimer un utilisateur (admin seulement)
# @router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
# def delete_existing_user(
#     user_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_active_admin_user) # Dépendance pour vérifier le rôle admin
# ):
#     db_user = crud_user.delete_user(db, user_id=user_id)
#     if not db_user:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
#     return {"message": "User deleted successfully"}
