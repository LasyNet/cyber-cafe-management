#!/bin/bash

echo "🔍 Test de la Structure du Code du Service d'Authentification..."
echo ""

# Vérifier la structure des fichiers
echo "📁 Vérification de la structure des fichiers..."

# Vérifier les fichiers essentiels
required_files=(
    "../backend/auth-service/requirements.txt"
    "../backend/auth-service/Dockerfile"
    "../backend/auth-service/app/main.py"
    "../backend/auth-service/app/core/config.py"
    "../backend/auth-service/app/api/v1/endpoints/auth.py"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file (manquant)"
        missing_files+=("$file")
    fi
done

echo ""

# Vérifier la syntaxe Python
echo "🐍 Vérification de la syntaxe Python..."

if command -v python3 >/dev/null 2>&1; then
    python_files=(
        "../backend/auth-service/app/main.py"
        "../backend/auth-service/app/core/config.py"
        "../backend/auth-service/app/api/v1/endpoints/auth.py"
    )
    
    syntax_errors=()
    for file in "${python_files[@]}"; do
        if [ -f "$file" ]; then
            if python3 -m py_compile "$file" 2>/dev/null; then
                echo "   ✅ $file (syntaxe OK)"
            else
                echo "   ❌ $file (erreur de syntaxe)"
                syntax_errors+=("$file")
            fi
        fi
    done
else
    echo "   ⚠️  Python3 non installé, impossible de vérifier la syntaxe"
fi

echo ""

# Vérifier les dépendances
echo "📦 Vérification des dépendances..."

if [ -f "../backend/auth-service/requirements.txt" ]; then
    echo "   ✅ requirements.txt trouvé"
    echo "   📋 Dépendances listées :"
    while IFS= read -r line; do
        if [[ ! "$line" =~ ^[[:space:]]*# ]] && [[ -n "$line" ]]; then
            echo "      - $line"
        fi
    done < "../backend/auth-service/requirements.txt"
else
    echo "   ❌ requirements.txt manquant"
fi

echo ""

# Vérifier le Dockerfile
echo "🐳 Vérification du Dockerfile..."

if [ -f "../backend/auth-service/Dockerfile" ]; then
    echo "   ✅ Dockerfile trouvé"
    
    # Vérifier les éléments essentiels du Dockerfile
    dockerfile_checks=(
        "FROM python"
        "WORKDIR /app"
        "COPY requirements.txt"
        "RUN pip install"
        "COPY app/"
        "EXPOSE 8001"
        "CMD.*uvicorn"
    )
    
    for check in "${dockerfile_checks[@]}"; do
        if grep -q "$check" "../backend/auth-service/Dockerfile"; then
            echo "      ✅ Contient: $check"
        else
            echo "      ⚠️  Manque: $check"
        fi
    done
else
    echo "   ❌ Dockerfile manquant"
fi

echo ""

# Vérifier la configuration
echo "⚙️  Vérification de la configuration..."

if [ -f "../backend/auth-service/app/core/config.py" ]; then
    config_checks=(
        "DATABASE_URL"
        "SECRET_KEY"
        "ALGORITHM"
        "ACCESS_TOKEN_EXPIRE_MINUTES"
    )
    
    for check in "${config_checks[@]}"; do
        if grep -q "$check" "../backend/auth-service/app/core/config.py"; then
            echo "   ✅ Variable configurée: $check"
        else
            echo "   ❌ Variable manquante: $check"
        fi
    done
else
    echo "   ❌ Fichier de configuration manquant"
fi

echo ""

# Vérifier les endpoints
echo "🔗 Vérification des endpoints..."

if [ -f "../backend/auth-service/app/api/v1/endpoints/auth.py" ]; then
    endpoint_checks=(
        "/register"
        "/login"
        "/me"
        "/create-admin"
    )
    
    for check in "${endpoint_checks[@]}"; do
        if grep -q "$check" "../backend/auth-service/app/api/v1/endpoints/auth.py"; then
            echo "   ✅ Endpoint trouvé: $check"
        else
            echo "   ❌ Endpoint manquant: $check"
        fi
    done
else
    echo "   ❌ Fichier d'endpoints manquant"
fi

echo ""

# Résumé
echo "📊 Résumé des Tests :"

if [ ${#missing_files[@]} -eq 0 ]; then
    echo "   ✅ Tous les fichiers requis sont présents"
else
    echo "   ❌ Fichiers manquants : ${#missing_files[@]}"
    for file in "${missing_files[@]}"; do
        echo "      - $file"
    done
fi

if [ ${#syntax_errors[@]} -eq 0 ]; then
    echo "   ✅ Aucune erreur de syntaxe Python détectée"
else
    echo "   ❌ Erreurs de syntaxe Python : ${#syntax_errors[@]}"
fi

echo ""
echo "🎉 Tests de structure terminés !"
echo ""
echo "💡 Prochaines étapes :"
echo "   1. Démarrer Docker Desktop"
echo "   2. Exécuter : ./setup-env.sh"
echo "   3. Exécuter : ./start-services.sh"
echo "   4. Exécuter : ./test-auth-service.sh" 