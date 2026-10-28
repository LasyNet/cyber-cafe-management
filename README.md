# 🖥️ Gestion de cyber-café

Plateforme de gestion de cyber-café organisée en services backend et une interface web React. Le dépôt contient un service d'authentification FastAPI, un service de gestion des clients NestJS et une première interface frontend.

## Architecture actuelle
- **Frontend** : React, TypeScript, Vite et Lucide. Tableau de bord en cours de construction avec données de démonstration.
- **Auth Service** : FastAPI, JWT et PostgreSQL.
- **Clients Service** : NestJS, TypeORM et PostgreSQL.
- **Infrastructure** : scripts et configuration Docker Compose (optionnels pour le développement local sans conteneurs).
- **À venir** : connexion des données réelles, services ordinateurs/sessions/paiements, passerelle API et reporting.

## Démarrer le frontend sans Docker

Prérequis : Node.js 20+ et npm.

```bash
git clone https://github.com/LasyNet/cyber-cafe-management.git
cd cyber-cafe-management/frontend
npm install
npm run dev
```

Ouvrir l'adresse affichée par Vite (par défaut http://localhost:5173).

Pour vérifier le build de production :

```bash
npm run build
npm run preview
```

> La première version du frontend est une démonstration interactive. Les sessions, indicateurs et ordinateurs utilisent des données locales temporaires ; aucune donnée n'est encore envoyée aux services backend.

## Services backend

### Auth Service
```bash
cd backend/auth-service
python -m venv .venv
# Activez l'environnement virtuel
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

Configurez d'abord les variables requises dans `backend/auth-service/.env` à partir de `.env.example`.

### Clients Service
```bash
cd backend/clients-service
npm ci
npm run build
npm test -- --runInBand
```

Configurez les variables de connexion PostgreSQL dans `backend/clients-service/.env` à partir de `env.example`.

## Configuration et sécurité
- Ne commitez jamais les fichiers `.env` ni les identifiants de base de données.
- La connexion à Neon/PostgreSQL sera configurée séparément pour chaque service.
- Avant une mise en production, prévoir TLS, migrations, sauvegardes, gestion des secrets et supervision.

## Contribution
Créez une branche dédiée, testez vos changements et ouvrez une Pull Request vers `main`.
