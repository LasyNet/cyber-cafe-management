# Infrastructure - Services de Base de Données

Ce dossier contient la configuration Docker pour les services de base de données nécessaires au projet de gestion de cyber-café.

## Services Disponibles

### Bases de Données PostgreSQL
- **Auth DB** (Port 5432) : Service d'authentification
- **Clients DB** (Port 5433) : Gestion des clients
- **Computers DB** (Port 5434) : Gestion des ordinateurs
- **Sessions DB** (Port 5435) : Gestion des sessions
- **Reporting DB** (Port 5436) : Rapports et statistiques

### Cache Redis
- **Redis** (Port 6379) : Cache et sessions

## Prérequis

1. **Docker Desktop** doit être installé et en cours d'exécution
2. **Docker Compose** doit être disponible

## Configuration Initiale

### 1. Configuration de l'Environnement

```bash
# Depuis le dossier infrastructure
./setup-env.sh
```

Ce script va :
- Créer un fichier `.env` à partir de `env.example`
- Générer une clé JWT secrète aléatoire
- Configurer toutes les variables d'environnement

### 2. Personnalisation (Optionnel)

Vous pouvez modifier le fichier `.env` selon vos besoins :
- Changer les mots de passe
- Modifier les ports
- Ajuster les configurations

## Utilisation

### Démarrage des Services

```bash
# Depuis le dossier infrastructure
./start-services.sh

# Ou manuellement
docker-compose --env-file .env up -d
```

### Arrêt des Services

```bash
# Depuis le dossier infrastructure
./stop-services.sh

# Ou manuellement
docker-compose --env-file .env down
```

### Vérification du Statut

```bash
docker-compose --env-file .env ps
```

### Visualisation des Logs

```bash
# Tous les services
docker-compose --env-file .env logs

# Service spécifique
docker-compose --env-file .env logs auth-db
```

## Configuration

### Variables d'Environnement

Le fichier `.env` contient toutes les variables de configuration :

#### Bases de Données
- `POSTGRES_USER`: Nom d'utilisateur PostgreSQL
- `POSTGRES_PASSWORD`: Mot de passe PostgreSQL
- `AUTH_DB_NAME`, `CLIENTS_DB_NAME`, etc. : Noms des bases de données
- `AUTH_DB_PORT`, `CLIENTS_DB_PORT`, etc. : Ports des bases de données

#### Services Backend
- `AUTH_SERVICE_PORT`, `CLIENTS_SERVICE_PORT`, etc. : Ports des services
- `JWT_SECRET_KEY`: Clé secrète pour les tokens JWT
- `JWT_ALGORITHM`: Algorithme de signature JWT
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`: Durée de vie des tokens d'accès

#### Redis
- `REDIS_HOST`: Hôte Redis
- `REDIS_PORT`: Port Redis
- `REDIS_PASSWORD`: Mot de passe Redis (optionnel)

#### Frontend
- `FRONTEND_PORT`: Port du frontend
- `REACT_APP_API_URL`: URL de l'API pour React

### Volumes
Les données sont persistées dans le dossier configuré par `DATA_VOLUME_PATH` :
- `${DATA_VOLUME_PATH}/auth/` : Données de la base d'authentification
- `${DATA_VOLUME_PATH}/clients/` : Données des clients
- `${DATA_VOLUME_PATH}/computers/` : Données des ordinateurs
- `${DATA_VOLUME_PATH}/sessions/` : Données des sessions
- `${DATA_VOLUME_PATH}/reporting/` : Données de reporting
- `${DATA_VOLUME_PATH}/redis/` : Données Redis

## Connexion aux Bases de Données

### PostgreSQL
```bash
# Auth DB
psql -h ${AUTH_DB_HOST} -p ${AUTH_DB_PORT} -U ${POSTGRES_USER} -d ${AUTH_DB_NAME}

# Clients DB
psql -h ${CLIENTS_DB_HOST} -p ${CLIENTS_DB_PORT} -U ${POSTGRES_USER} -d ${CLIENTS_DB_NAME}

# Computers DB
psql -h ${COMPUTERS_DB_HOST} -p ${COMPUTERS_DB_PORT} -U ${POSTGRES_USER} -d ${COMPUTERS_DB_NAME}

# Sessions DB
psql -h ${SESSIONS_DB_HOST} -p ${SESSIONS_DB_PORT} -U ${POSTGRES_USER} -d ${SESSIONS_DB_NAME}

# Reporting DB
psql -h ${REPORTING_DB_HOST} -p ${REPORTING_DB_PORT} -U ${POSTGRES_USER} -d ${REPORTING_DB_NAME}
```

### Redis
```bash
redis-cli -h ${REDIS_HOST} -p ${REDIS_PORT}
```

## Dépannage

### Docker Desktop non démarré
Si vous obtenez l'erreur "docker: error during connect", démarrez Docker Desktop.

### Ports déjà utilisés
Si un port est déjà utilisé, modifiez le fichier `docker-compose.yml` pour utiliser un port différent.

### Problèmes de permissions
Sur Windows, assurez-vous que Docker Desktop a accès aux dossiers partagés.

## Sécurité

⚠️ **Attention** : Cette configuration est destinée au développement uniquement. Pour la production :
- Changez les mots de passe par défaut
- Utilisez des variables d'environnement sécurisées
- Configurez des réseaux Docker appropriés
- Activez l'authentification Redis 