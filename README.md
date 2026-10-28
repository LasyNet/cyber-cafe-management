# 🖥️ Gestion de cyber-café

Plateforme de gestion de cyber-café organisée en services backend. Le dépôt contient actuellement un service d'authentification FastAPI et un service de gestion des clients NestJS, ainsi que l'infrastructure PostgreSQL/Redis pour le développement. Les services ordinateurs, sessions, passerelle API et reporting restent à implémenter ou à intégrer.

## Architecture actuelle
- **Auth Service** : FastAPI, JWT et PostgreSQL.
- **Clients Service** : NestJS, TypeORM et PostgreSQL.
- **Infrastructure** : Docker Compose, instances PostgreSQL et Redis.
- **Frontend / autres services** : à développer.

## Prérequis
- Docker Desktop ou Docker Engine avec le plugin Compose
- Git
- OpenSSL

## Démarrage local
Depuis la racine du dépôt :
```bash
git clone https://github.com/LasyNet/cyber-cafe-management.git
cd cyber-cafe-management/infrastructure
chmod +x setup-env.sh start-services.sh stop-services.sh test-connection.sh
./setup-env.sh
./start-services.sh
./test-connection.sh
```

Le script crée `.env` à partir de `env.example` et génère des mots de passe PostgreSQL/Redis et une clé JWT aléatoires. Pour arrêter les services sans effacer les données, lancez `./stop-services.sh`.

> **Attention :** `docker compose down -v` supprime les volumes et peut entraîner une perte de données.

## Configuration et sécurité
- Le modèle de configuration est `infrastructure/env.example`; ne commitez jamais les vrais fichiers `.env`.
- Pour le service d'authentification en local, configurez les variables requises à partir de `backend/auth-service/.env.example`. Compose injecte celles-ci depuis `infrastructure/.env`.
- Les ports Docker sont exposés uniquement sur l'interface locale.
- Redis exige un mot de passe dans Compose.
- Cette configuration est destinée au développement local. Avant la production, prévoyez TLS, gestion des secrets, migrations, sauvegardes et supervision.

## Développement
### Auth Service
```bash
cd backend/auth-service
python -m venv .venv
# Activez l'environnement virtuel
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

### Clients Service
```bash
cd backend/clients-service
npm ci
npm run build
npm test -- --runInBand
```
`npm run lint` vérifie sans modifier les fichiers; `npm run lint:fix` applique les corrections.

## Contribution
Créez une branche dédiée, testez vos changements et ouvrez une Pull Request vers `main`.
