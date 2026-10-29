#!/usr/bin/env bash
set -euo pipefail

echo "Démarrage de l'infrastructure locale Cyber Café..."

if [[ ! -f .env ]]; then
  echo "Erreur : le fichier .env n'existe pas. Lancez d'abord ./setup-env.sh." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Erreur : Docker n'est pas démarré." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

: "${DATA_VOLUME_PATH:?DATA_VOLUME_PATH doit être défini dans .env}"

mkdir -p -- "${DATA_VOLUME_PATH}/postgres" "${DATA_VOLUME_PATH}/redis"

docker compose --env-file .env down --remove-orphans
docker compose --env-file .env up -d

echo "État des conteneurs :"
docker compose --env-file .env ps
echo "Infrastructure démarrée. PostgreSQL : ${POSTGRES_PORT}, Redis : ${REDIS_PORT}"
