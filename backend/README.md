# Backend — Cyber Café

Nouveau backend construit en **Python + FastAPI**, avec PostgreSQL, SQLAlchemy 2 et Alembic. Cette application constitue la base propre destinée à remplacer progressivement les anciens services backend.

## Principes de conception

- **Responsabilités séparées** : routes HTTP, configuration, logique métier, persistance et schémas ne doivent pas être mélangés.
- **Code simple et explicite** : fonctions courtes, noms métier clairs, pas d'abstraction prématurée ni de duplication.
- **Typage** : annotations Python et validation des entrées/sorties.
- **Sécurité par défaut** : secrets dans les variables d'environnement, validation des données, CORS explicite, aucune donnée sensible dans les logs.
- **Persistance fiable** : PostgreSQL, migrations Alembic versionnées; pas de création automatique du schéma en production.
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

Les modules métier seront ajoutés progressivement à partir des besoins de l'application : authentification et rôles, clients, postes informatiques, sessions, paiements, produits/ventes, recettes, notifications, messagerie et corbeille. Les anciens services ne seront supprimés qu'après migration, tests et validation des contrats nécessaires au frontend.

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
ruff check .
ruff format --check .
```

Avant d'implémenter les domaines métier, vérifier les écrans et types du frontend pour conserver un contrat API cohérent. Chaque domaine devra être livré avec validation, gestion d'erreurs, migrations et tests.
