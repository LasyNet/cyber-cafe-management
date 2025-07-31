#!/bin/bash

echo "🧪 Test du Service d'Authentification..."

# Vérifier si le fichier .env existe
if [ ! -f ".env" ]; then
    echo "❌ Le fichier .env n'existe pas."
    echo "💡 Exécutez d'abord : ./setup-env.sh"
    exit 1
fi

# Charger les variables d'environnement
source .env

# URL de base du service
AUTH_SERVICE_URL="http://${AUTH_SERVICE_HOST}:${AUTH_SERVICE_PORT}"

echo "📍 URL du service: $AUTH_SERVICE_URL"
echo ""

# Fonction pour tester un endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo "🔍 Test: $description"
    echo "   $method $AUTH_SERVICE_URL$endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$AUTH_SERVICE_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$AUTH_SERVICE_URL$endpoint")
    fi
    
    # Séparer le corps de la réponse et le code de statut
    body=$(echo "$response" | head -n -1)
    status_code=$(echo "$response" | tail -n 1)
    
    if [ "$status_code" -ge 200 ] && [ "$status_code" -lt 300 ]; then
        echo "   ✅ Succès ($status_code)"
        echo "   📄 Réponse: $body" | head -c 100
        [ ${#body} -gt 100 ] && echo "..."
    else
        echo "   ❌ Échec ($status_code)"
        echo "   📄 Réponse: $body"
    fi
    echo ""
}

# Test 1: Vérifier que le service est en cours d'exécution
echo "📋 Test 1: Vérification du service"
test_endpoint "GET" "/" "" "Service en cours d'exécution"

# Test 2: Créer un utilisateur administrateur
echo "📋 Test 2: Création d'un utilisateur administrateur"
admin_data='{
    "username": "admin",
    "email": "admin@cybercafe.com",
    "password": "admin123"
}'
test_endpoint "POST" "/auth/create-admin" "$admin_data" "Création d'un administrateur"

# Test 3: Enregistrer un nouvel utilisateur
echo "📋 Test 3: Enregistrement d'un nouvel utilisateur"
user_data='{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
}'
test_endpoint "POST" "/auth/register" "$user_data" "Enregistrement d'un utilisateur"

# Test 4: Tentative de connexion avec l'utilisateur créé
echo "📋 Test 4: Connexion de l'utilisateur"
login_data='{
    "username": "testuser",
    "password": "password123"
}'
test_endpoint "POST" "/auth/login" "$login_data" "Connexion utilisateur"

# Test 5: Tentative de connexion avec des identifiants incorrects
echo "📋 Test 5: Test de connexion avec identifiants incorrects"
wrong_login_data='{
    "username": "wronguser",
    "password": "wrongpassword"
}'
test_endpoint "POST" "/auth/login" "$wrong_login_data" "Connexion avec identifiants incorrects"

# Test 6: Vérifier la documentation Swagger
echo "📋 Test 6: Vérification de la documentation"
test_endpoint "GET" "/docs" "" "Documentation Swagger"

echo "🎉 Tests terminés !"
echo ""
echo "💡 Pour accéder à la documentation interactive :"
echo "   $AUTH_SERVICE_URL/docs"
echo ""
echo "💡 Pour tester manuellement avec curl :"
echo "   # Créer un utilisateur"
echo "   curl -X POST $AUTH_SERVICE_URL/auth/register \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"username\":\"test\",\"password\":\"test123\"}'"
echo ""
echo "   # Se connecter"
echo "   curl -X POST $AUTH_SERVICE_URL/auth/login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"username\":\"test\",\"password\":\"test123\"}'" 