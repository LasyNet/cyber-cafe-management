#!/bin/bash

echo "🧪 Test des connexions aux services..."

# Vérifier si le fichier .env existe
if [ ! -f ".env" ]; then
    echo "❌ Le fichier .env n'existe pas."
    echo "💡 Exécutez d'abord : ./setup-env.sh"
    exit 1
fi

# Charger les variables d'environnement
source .env

# Fonction pour tester une connexion PostgreSQL
test_postgres() {
    local service_name=$1
    local host=$2
    local port=$3
    local db_name=$4
    local user=$5
    local password=$6
    
    echo "🔍 Test de connexion à $service_name..."
    
    # Vérifier si le port est ouvert
    if nc -z $host $port 2>/dev/null; then
        echo "✅ Port $port ouvert pour $service_name"
        
        # Tester la connexion PostgreSQL
        if command -v psql >/dev/null 2>&1; then
            PGPASSWORD=$password psql -h $host -p $port -U $user -d $db_name -c "SELECT version();" >/dev/null 2>&1
            if [ $? -eq 0 ]; then
                echo "✅ Connexion PostgreSQL réussie pour $service_name"
            else
                echo "❌ Échec de connexion PostgreSQL pour $service_name"
            fi
        else
            echo "⚠️  psql non installé, impossible de tester la connexion PostgreSQL"
        fi
    else
        echo "❌ Port $port fermé pour $service_name"
    fi
    echo ""
}

# Fonction pour tester Redis
test_redis() {
    echo "🔍 Test de connexion à Redis..."
    
    if nc -z $REDIS_HOST $REDIS_PORT 2>/dev/null; then
        echo "✅ Port $REDIS_PORT ouvert pour Redis"
        
        if command -v redis-cli >/dev/null 2>&1; then
            redis-cli -h $REDIS_HOST -p $REDIS_PORT ping >/dev/null 2>&1
            if [ $? -eq 0 ]; then
                echo "✅ Connexion Redis réussie"
            else
                echo "❌ Échec de connexion Redis"
            fi
        else
            echo "⚠️  redis-cli non installé, impossible de tester la connexion Redis"
        fi
    else
        echo "❌ Port $REDIS_PORT fermé pour Redis"
    fi
    echo ""
}

# Tests des bases de données PostgreSQL
test_postgres "Auth DB" $AUTH_DB_HOST $AUTH_DB_PORT $AUTH_DB_NAME $POSTGRES_USER $POSTGRES_PASSWORD
test_postgres "Clients DB" $CLIENTS_DB_HOST $CLIENTS_DB_PORT $CLIENTS_DB_NAME $POSTGRES_USER $POSTGRES_PASSWORD
test_postgres "Computers DB" $COMPUTERS_DB_HOST $COMPUTERS_DB_PORT $COMPUTERS_DB_NAME $POSTGRES_USER $POSTGRES_PASSWORD
test_postgres "Sessions DB" $SESSIONS_DB_HOST $SESSIONS_DB_PORT $SESSIONS_DB_NAME $POSTGRES_USER $POSTGRES_PASSWORD
test_postgres "Reporting DB" $REPORTING_DB_HOST $REPORTING_DB_PORT $REPORTING_DB_NAME $POSTGRES_USER $POSTGRES_PASSWORD

# Test Redis
test_redis

echo "🎉 Tests terminés !"
echo ""
echo "💡 Si certains tests échouent, vérifiez que :"
echo "   - Docker Desktop est démarré"
echo "   - Les services sont en cours d'exécution (./start-services.sh)"
echo "   - Les ports ne sont pas utilisés par d'autres applications" 