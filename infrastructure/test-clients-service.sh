#!/bin/bash

echo "🧪 Test du Service de Gestion des Clients..."

# Vérifier si le fichier .env existe
if [ ! -f ".env" ]; then
    echo "❌ Le fichier .env n'existe pas."
    echo "💡 Exécutez d'abord : ./setup-env.sh"
    exit 1
fi

# Charger les variables d'environnement
source .env

# URL de base du service
CLIENTS_SERVICE_URL="http://${CLIENTS_SERVICE_HOST}:${CLIENTS_SERVICE_PORT}"

echo "📍 URL du service: $CLIENTS_SERVICE_URL"
echo ""

# Fonction pour tester un endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo "🔍 Test: $description"
    echo "   $method $CLIENTS_SERVICE_URL$endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$CLIENTS_SERVICE_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$CLIENTS_SERVICE_URL$endpoint")
    elif [ "$method" = "PATCH" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PATCH \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$CLIENTS_SERVICE_URL$endpoint")
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
test_endpoint "GET" "/api/v1/clients" "" "Service en cours d'exécution"

# Test 2: Créer un nouveau client
echo "📋 Test 2: Création d'un nouveau client"
client_data='{
    "username": "john_doe",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+33123456789",
    "dateOfBirth": "1990-01-15",
    "address": "123 Rue de la Paix",
    "city": "Paris",
    "postalCode": "75001",
    "country": "France",
    "type": "regular",
    "balance": 50.00
}'
test_endpoint "POST" "/api/v1/clients" "$client_data" "Création d'un client"

# Test 3: Créer un client VIP
echo "📋 Test 3: Création d'un client VIP"
vip_client_data='{
    "username": "jane_vip",
    "email": "jane.vip@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "+33987654321",
    "city": "Lyon",
    "type": "vip",
    "balance": 200.00,
    "preferences": {
        "favoriteGames": ["CS2", "Valorant"],
        "preferredSeat": "window"
    }
}'
test_endpoint "POST" "/api/v1/clients" "$vip_client_data" "Création d'un client VIP"

# Test 4: Récupérer tous les clients
echo "📋 Test 4: Récupération de tous les clients"
test_endpoint "GET" "/api/v1/clients" "" "Liste des clients"

# Test 5: Récupérer les statistiques
echo "📋 Test 5: Récupération des statistiques"
test_endpoint "GET" "/api/v1/clients/statistics" "" "Statistiques des clients"

# Test 6: Rechercher un client par nom d'utilisateur
echo "📋 Test 6: Recherche par nom d'utilisateur"
test_endpoint "GET" "/api/v1/clients/username/john_doe" "" "Recherche par username"

# Test 7: Ajouter du solde à un client
echo "📋 Test 7: Ajout de solde"
balance_data='{"amount": 25.50}'
test_endpoint "PATCH" "/api/v1/clients/1/balance/add" "$balance_data" "Ajout de solde"

# Test 8: Ajouter des points de fidélité
echo "📋 Test 8: Ajout de points de fidélité"
points_data='{"points": 100}'
test_endpoint "PATCH" "/api/v1/clients/1/loyalty-points" "$points_data" "Ajout de points de fidélité"

# Test 9: Mettre à jour le statut d'un client
echo "📋 Test 9: Mise à jour du statut"
status_data='{"status": "active"}'
test_endpoint "PATCH" "/api/v1/clients/1/status" "$status_data" "Mise à jour du statut"

# Test 10: Recherche avec filtres
echo "📋 Test 10: Recherche avec filtres"
test_endpoint "GET" "/api/v1/clients?search=john&type=regular&limit=5" "" "Recherche avec filtres"

# Test 11: Vérifier la documentation Swagger
echo "📋 Test 11: Vérification de la documentation"
test_endpoint "GET" "/docs" "" "Documentation Swagger"

echo "🎉 Tests terminés !"
echo ""
echo "💡 Pour accéder à la documentation interactive :"
echo "   $CLIENTS_SERVICE_URL/docs"
echo ""
echo "💡 Pour tester manuellement avec curl :"
echo "   # Créer un client"
echo "   curl -X POST $CLIENTS_SERVICE_URL/api/v1/clients \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"username\":\"test\",\"firstName\":\"Test\",\"lastName\":\"User\"}'"
echo ""
echo "   # Récupérer les clients"
echo "   curl $CLIENTS_SERVICE_URL/api/v1/clients" 