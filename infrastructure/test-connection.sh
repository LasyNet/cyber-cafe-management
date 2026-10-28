#!/usr/bin/env bash
set -uo pipefail

echo "Vérification des connexions aux services..."

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

test_postgres() {
  local name="$1" host="$2" port="$3" database="$4"
  if ! command -v nc >/dev/null 2>&1; then
    return
  fi

  echo "Test PostgreSQL : $name ($host:$port)"
  if ! nc -z "$host" "$port" 2>/dev/null; then
    echo "ÉCHEC : port $port inaccessible pour $name"
    failures=$((failures + 1))
    return
  fi

  if command -v psql >/dev/null 2>&1; then
    if PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$host" -p "$port" -U "$POSTGRES_USER" -d "$database" -v ON_ERROR_STOP=1 -c "SELECT 1;" >/dev/null 2>&1; then
      echo "OK : connexion PostgreSQL $name"
    else
      echo "ÉCHEC : authentification/connexion PostgreSQL $name"
      failures=$((failures + 1))
    fi
  fi
}

test_postgres "Auth DB" "$AUTH_DB_HOST" "$AUTH_DB_PORT" "$AUTH_DB_NAME"
test_postgres "Clients DB" "$CLIENTS_DB_HOST" "$CLIENTS_DB_PORT" "$CLIENTS_DB_NAME"
test_postgres "Computers DB" "$COMPUTERS_DB_HOST" "$COMPUTERS_DB_PORT" "$COMPUTERS_DB_NAME"
test_postgres "Sessions DB" "$SESSIONS_DB_HOST" "$SESSIONS_DB_PORT" "$SESSIONS_DB_NAME"
test_postgres "Reporting DB" "$REPORTING_DB_HOST" "$REPORTING_DB_PORT" "$REPORTING_DB_NAME"

echo "Test Redis ($REDIS_HOST:$REDIS_PORT)"
if command -v nc >/dev/null 2>&1 && ! nc -z "$REDIS_HOST" "$REDIS_PORT" 2>/dev/null; then
  echo "ÉCHEC : port Redis inaccessible"
  failures=$((failures + 1))
elif command -v redis-cli >/dev/null 2>&1; then
  if REDISCLI_AUTH="$REDIS_PASSWORD" redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping 2>/dev/null | grep -qx PONG; then
    echo "OK : connexion Redis authentifiée"
  else
    echo "ÉCHEC : connexion/authentification Redis"
    failures=$((failures + 1))
  fi
fi

if (( failures > 0 )); then
  echo "Échec : $failures vérification(s) n'ont pas abouti."
  exit 1
fi

echo "Toutes les vérifications de connexion ont réussi."
