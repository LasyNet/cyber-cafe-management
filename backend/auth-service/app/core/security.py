# app/core/security.py

from datetime import datetime, timedelta, timezone
from typing import Optional

# Importe les classes et fonctions nécessaires pour la gestion des JWT
from jose import JWTError, jwt

# Importe la classe pour le hachage des mots de passe
from passlib.context import CryptContext

# Importe les classes et fonctions de FastAPI pour la gestion des dépendances et des erreurs HTTP
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer

# Importe les paramètres de configuration de l'application (clé secrète, algorithme, expiration du token)
from app.core.config import settings

# Importe le schéma Pydantic pour les données contenues dans le token
from app.schemas.user import TokenData

# Contexte pour le hachage des mots de passe.
# Nous utilisons 'bcrypt' qui est un algorithme de hachage robuste et recommandé.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Schéma OAuth2 pour l'authentification par token Bearer.
# 'tokenUrl' est l'URL où le client peut obtenir un token (utilisé par la documentation Swagger UI).
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Fonction pour hacher un mot de passe en texte clair.
def get_password_hash(password: str) -> str:
    """
    Hache le mot de passe fourni en utilisant l'algorithme bcrypt.
    """
    return pwd_context.hash(password)

# Fonction pour vérifier si un mot de passe en texte clair correspond à un mot de passe haché.
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Vérifie si le mot de passe en texte clair correspond au mot de passe haché.
    """
    return pwd_context.verify(plain_password, hashed_password)

# Fonction pour créer un token d'accès JWT.
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crée un token d'accès JWT avec les données fournies et une date d'expiration.
    """
    to_encode = data.copy() # Crée une copie des données pour éviter de modifier l'original

    # Calcule la date d'expiration du token
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # Utilise la durée d'expiration par défaut définie dans les paramètres
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire}) # Ajoute la date d'expiration au payload du token
    
    # Encode le token JWT en utilisant la clé secrète et l'algorithme définis dans les paramètres
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# Fonction pour décoder et valider un token d'accès JWT.
def decode_access_token(token: str) -> Optional[TokenData]:
    """
    Décode et valide un token JWT.
    Lève une HTTPException si le token est invalide ou expiré.
    """
    # Définit l'exception à lever en cas de problème d'authentification
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Tente de décoder le token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        # Récupère le sujet du token (généralement le nom d'utilisateur)
        username: str = payload.get("sub")
        
        # Si le nom d'utilisateur n'est pas présent, lève une exception
        if username is None:
            raise credentials_exception
        
        # Crée un objet TokenData à partir du nom d'utilisateur
        token_data = TokenData(username=username)
    except JWTError:
        # Si une erreur JWT se produit (ex: signature invalide, token expiré), lève une exception
        raise credentials_exception
    return token_data

# Dépendance FastAPI pour obtenir le nom d'utilisateur courant à partir du token JWT.
# Cette fonction est utilisée dans les endpoints pour protéger les routes.
def get_current_user_username(token: str = Depends(oauth2_scheme)) -> str:
    """
    Dépendance FastAPI qui extrait et valide le token JWT de la requête.
    Retourne le nom d'utilisateur si le token est valide, sinon lève une HTTPException.
    """
    token_data = decode_access_token(token) # Décode et valide le token
    
    # Vérifie si les données du token sont valides
    if token_data is None or token_data.username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token_data.username
