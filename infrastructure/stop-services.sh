#!/bin/bash

echo "🛑 Arrêt des services de base de données pour le Cyber Café..."

# Vérifier si le fichier .env existe
if [ ! -f ".env" ]; then
    echo "❌ Le fichier .env n'existe pas."
    echo "💡 Exécutez d'abord : ./setup-env.sh"
    exit 1
fi

# Vérifier si Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker n'est pas en cours d'exécution."
    exit 1
fi

# Arrêter et supprimer les conteneurs
echo "🔄 Arrêt des conteneurs..."
docker-compose --env-file .env down

echo "✅ Services arrêtés avec succès !" 