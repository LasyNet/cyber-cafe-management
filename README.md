# 🖥️ Gestion de cyber-café

Application de gestion de cyber-café avec une interface React et un backend Python unifié.

## Architecture

- **Frontend** : React, TypeScript, Vite et Lucide. L'interface contient actuellement des données de démonstration locales.
- **Backend** : Python, FastAPI, SQLAlchemy 2 et Alembic. Le backend est en cours de reconstruction progressive.
- **Base de données locale** : PostgreSQL, configuré via Docker Compose.
- **Cache local optionnel** : Redis, disponible pour les besoins futurs.

## Démarrer le frontend

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

> La première version du frontend est une démonstration interactive. Les sessions, indicateurs et ordinateurs utilisent des données locales temporaires ; les fonctionnalités métier ne sont pas encore connectées à l'API.

## Démarrer le backend Python

Prérequis : Python 3.12+ et PostgreSQL.

```bash
cd backend
python -m venv .venv
# Windows PowerShell : .venv\Scripts\Activate.ps1
# Linux/macOS : source .venv/bin/activate
python -m pip install -e ".[dev]"
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

- Documentation interactive : http://localhost:8000/docs
- Vérification de santé : http://localhost:8000/api/v1/health

## Infrastructure locale (optionnelle)

Depuis le dossier `infrastructure` :

```bash
./setup-env.sh
./start-services.sh
```

Cela démarre PostgreSQL et Redis avec Docker Compose. Le backend FastAPI se lance séparément depuis `backend/`.

## Qualité et contribution

```bash
cd backend
pytest
ruff check app tests
ruff format --check app tests
```

Travaillez sur une branche dédiée et ouvrez une Pull Request vers `DEV`. La branche `main` n'est mise à jour qu'après validation explicite.
