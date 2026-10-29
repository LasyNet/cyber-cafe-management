# Backend — Cyber Café

Backend unifié construit en **Python + FastAPI**, avec PostgreSQL, SQLAlchemy 2 et Alembic.

## Principes de conception

- **Responsabilités séparées** : routes HTTP, configuration, logique métier, persistance et schémas ne doivent pas être mélangés.
- **Code simple et explicite** : fonctions courtes, noms métier clairs, pas d'abstraction prématurée ni de duplication.
- **Typage** : annotations Python et validation des entrées/sorties.
- **Sécurité par défaut** : secrets dans les variables d'environnement, validation des données, CORS explicite, aucune donnée sensible dans les logs.
- **Persistance fiable** : PostgreSQL et migrations Alembic versionnées; pas de création automatique du schéma en production.
- **Tests** : tests automatisés pour les règles métier et les routes.
- **Compatibilité** : contrat API versionné sous `/api/v1`.

## Structure cible

```text
backend/
├── app/
│   ├── api/v1/endpoints/   # Couche HTTP
│   ├── core/               # Configuration et sécurité transversale
│   ├── db/                 # Engine, sessions et base commune
│   ├── models/             # Modèles SQLAlchemy
│   ├── schemas/            # Schémas Pydantic
│   ├── repositories/       # Accès aux données
│   ├── services/           # Règles métier
│   └── main.py             # Composition de l'application
├── migrations/             # Migrations Alembic
├── tests/
├── .env.example
└── pyproject.toml
```

Les modules métier seront ajoutés progressivement à partir des besoins de l'application : authentification et rôles, clients, postes informatiques, sessions, paiements, produits/ventes, recettes, notifications, messagerie et corbeille.

## Développement local

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

- Documentation interactive : `http://localhost:8000/docs`
- Health check : `http://localhost:8000/api/v1/health`

## Qualité

```bash
pytest
ruff check app tests
ruff format --check app tests
```

Avant d'implémenter les domaines métier, vérifier les écrans et types du frontend pour conserver un contrat API cohérent. Chaque domaine devra être livré avec validation, gestion d'erreurs, migrations et tests.


## Base Neon et migrations

La connexion est lue depuis la variable d'environnement `DATABASE_URL`. Sur Render, ajoute la chaîne de connexion PostgreSQL de Neon dans les variables d'environnement du service backend. Ne la committe jamais dans Git. Le code accepte les formats `postgres://`, `postgresql://` et `postgresql+psycopg://`.

Les migrations sont versionnées dans `migrations/versions` et ne sont pas exécutées automatiquement à l'import de l'application.

```bash
cd backend
alembic upgrade head
alembic current
```

Pour Render, avec **Root Directory = `backend`**, utilise `pip install -e .` comme Build Command. Pour appliquer les migrations avant le démarrage de l'API, configure la Start Command ainsi :

```bash
alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Cette commande applique uniquement les migrations non encore exécutées, puis démarre FastAPI. Elle suppose que `DATABASE_URL` est configurée dans Render et pointe vers la base Neon prévue pour cet environnement. Ne lance pas cette configuration contre une base contenant déjà des données importantes sans avoir vérifié son état.


## Authentification et autorisations API

Les routes métier sous `/api/v1/clients`, `/computers`, `/sessions`, `/payments` et `/settings` exigent désormais un jeton Bearer obtenu via `POST /api/v1/auth/login`. Le contrôle vérifie à chaque requête que le compte existe toujours, est actif et conserve le rôle signé dans le jeton. Les jetons expirent après une heure. La route `/api/v1/health` reste publique.

- Les comptes sont provisionnés explicitement par un administrateur de la base, jamais par inscription publique.
- Les rôles sont `admin` et `employee`. Seuls les administrateurs peuvent modifier les paramètres du café.
- Les mots de passe sont hachés avec PBKDF2-HMAC-SHA256 et un sel unique; aucun mot de passe en clair n'est stocké.
- En production, définir `APP_ENV=production` et un `AUTH_SECRET_KEY` aléatoire unique d'au moins 32 caractères dans les variables d'environnement du service. Ne jamais committer cette valeur.

Créer un compte après avoir appliqué les migrations et configuré `DATABASE_URL` :

```bash
cd backend
python -m scripts.create_user
```

Le script demande le nom, l'e-mail, le rôle et le mot de passe de manière interactive. Créer le premier compte avec le rôle `admin`. Pour se connecter, envoyer un JSON `{"email":"admin@example.com","password":"..." }` à `POST /api/v1/auth/login`, puis transmettre le jeton retourné dans l'en-tête `Authorization: Bearer <token>`.

**Avant la mise en production :** configurer une limite de tentatives sur `/auth/login` au niveau du proxy ou de la plateforme, activer HTTPS et vérifier que les migrations de la table `users` sont appliquées. Le frontend de démonstration actuel n'est pas encore connecté à ce flux d'authentification.
