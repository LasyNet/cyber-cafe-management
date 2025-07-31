#!/bin/bash

echo "🚀 Démarrage des services de base de données pour le Cyber Café..."

# Vérifier si le fichier .env existe
if [ ! -f ".env" ]; then
    echo "❌ Le fichier .env n'existe pas."
    echo "💡 Exécutez d'abord : ./setup-env.sh"
    exit 1
fi

# Vérifier si Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker n'est pas en cours d'exécution. Veuillez démarrer Docker Desktop."
    exit 1
fi

# Charger les variables d'environnement
source .env

# Créer les dossiers de données s'ils n'existent pas
mkdir -p ${DATA_VOLUME_PATH}/auth
mkdir -p ${DATA_VOLUME_PATH}/clients
mkdir -p ${DATA_VOLUME_PATH}/computers
mkdir -p ${DATA_VOLUME_PATH}/sessions
mkdir -p ${DATA_VOLUME_PATH}/reporting
mkdir -p ${DATA_VOLUME_PATH}/redis

# Arrêter et supprimer les conteneurs existants
echo "🔄 Arrêt des conteneurs existants..."
docker-compose down

# Démarrer les services
echo "✅ Démarrage des services..."
docker-compose --env-file .env up -d

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 10

# Vérifier le statut des conteneurs
echo "📊 Statut des conteneurs :"
docker-compose ps

echo "🎉 Services démarrés avec succès !"
echo ""
echo "📋 Ports des services :"
echo "  - Auth DB: ${AUTH_DB_HOST}:${AUTH_DB_PORT}"
echo "  - Clients DB: ${CLIENTS_DB_HOST}:${CLIENTS_DB_PORT}"
echo "  - Computers DB: ${COMPUTERS_DB_HOST}:${COMPUTERS_DB_PORT}"
echo "  - Sessions DB: ${SESSIONS_DB_HOST}:${SESSIONS_DB_PORT}"
echo "  - Reporting DB: ${REPORTING_DB_HOST}:${REPORTING_DB_PORT}"
echo "  - Redis: ${REDIS_HOST}:${REDIS_PORT}" 