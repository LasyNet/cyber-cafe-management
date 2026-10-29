# Infrastructure locale — Cyber Café

Ce dossier fournit une infrastructure de développement locale optionnelle pour le backend Python.

## Services

- **PostgreSQL** : base de données unique du backend.
- **Redis** : service de cache optionnel pour les besoins futurs.

Les services backend applicatifs ne sont pas définis dans Docker Compose : le backend FastAPI se lance séparément depuis le dossier `backend/`.

## Prérequis

- Docker Desktop ou Docker Engine démarré
- Docker Compose
- Bash et OpenSSL pour le script de configuration

## Configuration et démarrage

Depuis ce dossier :

```bash
./setup-env.sh
./start-services.sh
```

Le script crée un fichier `.env` local avec des mots de passe aléatoires. Ne commitez jamais ce fichier.

Pour vérifier l'état des conteneurs :

```bash
docker compose --env-file .env ps
docker compose --env-file .env logs
```

Pour arrêter les services :

```bash
./stop-services.sh
```

Les données persistantes sont conservées sous le chemin défini par `DATA_VOLUME_PATH`. Cette configuration est destinée au développement local, pas à la production.
