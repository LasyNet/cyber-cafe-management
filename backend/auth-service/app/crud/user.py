# app/crud/user.py

from sqlalchemy.orm import Session # Importe la session SQLAlchemy pour interagir avec la base de données
from app.db.models import User # Importe le modèle User défini dans app/db/models.py
from app.schemas.user import UserCreate, UserUpdate # Importe les schémas Pydantic pour la création et la mise à jour
from app.core.security import get_password_hash # Importe la fonction de hachage de mot de passe

# Fonction pour obtenir un utilisateur par son ID
def get_user(db: Session, user_id: int):
    """
    Récupère un utilisateur de la base de données par son ID.
    """
    return db.query(User).filter(User.id == user_id).first()

# Fonction pour obtenir un utilisateur par son nom d'utilisateur
def get_user_by_username(db: Session, username: str):
    """
    Récupère un utilisateur de la base de données par son nom d'utilisateur.
    """
    return db.query(User).filter(User.username == username).first()

# Fonction pour obtenir un utilisateur par son email
def get_user_by_email(db: Session, email: str):
    """
    Récupère un utilisateur de la base de données par son adresse email.
    """
    return db.query(User).filter(User.email == email).first()

# Fonction pour obtenir tous les utilisateurs (avec pagination)
def get_users(db: Session, skip: int = 0, limit: int = 100):
    """
    Récupère une liste d'utilisateurs de la base de données, avec support de pagination.
    """
    return db.query(User).offset(skip).limit(limit).all()

# Fonction pour créer un nouvel utilisateur
def create_user(db: Session, user: UserCreate):
    """
    Crée un nouvel utilisateur dans la base de données.
    Hache le mot de passe avant de le stocker.
    """
    hashed_password = get_password_hash(user.password) # Hache le mot de passe
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        is_admin=False, # Par défaut, un nouvel utilisateur n'est pas admin
        is_manager=False # Par défaut, un nouvel utilisateur n'est pas gérant
    )
    db.add(db_user) # Ajoute l'objet utilisateur à la session de la base de données
    db.commit() # Valide la transaction (sauvegarde dans la base de données)
    db.refresh(db_user) # Rafraîchit l'objet pour obtenir les données générées par la DB (comme l'ID)
    return db_user

# Fonction pour mettre à jour un utilisateur existant
def update_user(db: Session, db_user: User, user_update: UserUpdate):
    """
    Met à jour les informations d'un utilisateur existant.
    Gère le hachage du nouveau mot de passe si fourni.
    """
    # Convertit le schéma Pydantic en dictionnaire, en excluant les champs non définis
    update_data = user_update.model_dump(exclude_unset=True) 
    
    # Si un nouveau mot de passe est fourni, hachez-le
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = get_password_hash(update_data["password"])
        del update_data["password"] # Supprime le champ 'password' original pour ne pas le stocker en clair

    # Met à jour les attributs de l'objet utilisateur de la base de données
    for key, value in update_data.items():
        setattr(db_user, key, value) 

    db.add(db_user) # Ajoute l'objet modifié à la session
    db.commit() # Valide la transaction
    db.refresh(db_user) # Rafraîchit l'objet
    return db_user

# Fonction pour supprimer un utilisateur
def delete_user(db: Session, user_id: int):
    """
    Supprime un utilisateur de la base de données par son ID.
    """
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user:
        db.delete(db_user) # Supprime l'objet de la session
        db.commit() # Valide la transaction
    return db_user # Retourne l'utilisateur supprimé ou None s'il n'existait pas
