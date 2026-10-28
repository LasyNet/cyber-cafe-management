#!/usr/bin/env bash
set -euo pipefail

echo "Arrêt des services Cyber Café..."

if [[ ! -f .env ]]; then
  echo "Erreur : le fichier .env n'existe pas." >&2
  echo "Lancez d'abord ./setup-env.sh si vous devez configurer l'environnement." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Erreur : Docker n'est pas démarré." >&2
  exit 1
fi

docker compose --env-file .env down
echo "Services arrêtés. Les données persistantes sont conservées."
