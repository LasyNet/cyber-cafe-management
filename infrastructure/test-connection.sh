#!/usr/bin/env bash
set -uo pipefail

echo "Vérification des connexions à l'infrastructure..."

if [[ ! -f .env ]]; then
  echo "Erreur : le fichier .env n'existe pas. Lancez d'abord ./setup-env.sh." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

failures=0

for command_name in nc psql redis-cli; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Erreur : commande requise introuvable : $command_name" >&2
    failures=$((failures + 1))
  fi
done

if command -v nc >/dev/null 2>&1; then
  echo "Test PostgreSQL (localhost:${POSTGRES_PORT})"
  if nc -z localhost "$POSTGRES_PORT" 2>/dev/null; then
    if command -v psql >/dev/null 2>&1 && PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "SELECT 1;" >/dev/null 2>&1; then
      echo "OK : connexion PostgreSQL"
    else
      echo "ÉCHEC : authentification/connexion PostgreSQL"
      failures=$((failures + 1))
    fi
  else
    echo "ÉCHEC : port PostgreSQL inaccessible"
    failures=$((failures + 1))
  fi

  echo "Test Redis (localhost:${REDIS_PORT})"
  if nc -z localhost "$REDIS_PORT" 2>/dev/null; then
    if command -v redis-cli >/dev/null 2>&1 && REDISCLI_AUTH="$REDIS_PASSWORD" redis-cli -h localhost -p "$REDIS_PORT" ping 2>/dev/null | grep -qx PONG; then
      echo "OK : connexion Redis authentifiée"
    else
      echo "ÉCHEC : connexion/authentification Redis"
      failures=$((failures + 1))
    fi
  else
    echo "ÉCHEC : port Redis inaccessible"
    failures=$((failures + 1))
  fi
fi

if (( failures > 0 )); then
  echo "Échec : $failures vérification(s) n'ont pas abouti."
  exit 1
fi

echo "Toutes les vérifications de connexion ont réussi."
