#!/bin/bash

echo "🔧 Configuration de l'environnement pour le Cyber Café..."

# Vérifier si le fichier .env existe déjà
if [ -f ".env" ]; then
    echo "⚠️  Le fichier .env existe déjà."
    read -p "Voulez-vous le remplacer ? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Configuration annulée."
        exit 1
    fi
fi

# Copier le fichier d'exemple
if [ -f "env.example" ]; then
    cp env.example .env
    echo "✅ Fichier .env créé à partir de env.example"
else
    echo "❌ Le fichier env.example n'existe pas."
    exit 1
fi

# Générer une clé JWT secrète aléatoire
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "your-super-secret-jwt-key-change-in-production")

# Mettre à jour la clé JWT dans le fichier .env
if command -v sed >/dev/null 2>&1; then
    sed -i "s/your-super-secret-jwt-key-change-in-production/$JWT_SECRET/" .env
    echo "🔐 Clé JWT générée et configurée"
else
    echo "⚠️  Impossible de générer une clé JWT automatiquement. Veuillez la modifier manuellement dans .env"
fi

echo ""
echo "🎉 Configuration terminée !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Vérifiez le fichier .env et modifiez les valeurs si nécessaire"
echo "2. Démarrez Docker Desktop"
echo "3. Lancez les services avec : ./start-services.sh"
echo ""
echo "🔒 N'oubliez pas de changer les mots de passe par défaut en production !" 