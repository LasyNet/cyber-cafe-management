<<<<<<< HEAD
# 🖥️ Système de Gestion de Cyber-Café

Un système complet de gestion de cyber-café avec architecture microservices, comprenant authentification, gestion des clients, ordinateurs, sessions et reporting.

## 🏗️ Architecture

Le projet utilise une architecture microservices avec les composants suivants :

### Backend Services
- **API Gateway** : Point d'entrée unique pour toutes les API
- **Auth Service** : Authentification et autorisation (JWT)
- **Clients Service** : Gestion des clients et comptes
- **Computers Service** : Gestion des ordinateurs et stations
- **Sessions Service** : Gestion des sessions utilisateurs
- **Reporting Service** : Rapports et statistiques

### Infrastructure
- **PostgreSQL** : 5 bases de données séparées (une par service)
- **Redis** : Cache et sessions
- **Docker** : Conteneurisation complète

### Frontend
- Interface utilisateur moderne (à développer)

## 🚀 Démarrage Rapide

### Prérequis
- Docker Desktop installé et en cours d'exécution
- Git

### Installation

1. **Cloner le projet**
   ```bash
   git clone <repository-url>
   cd cyber-cafe-management
   ```

2. **Configurer l'environnement**
   ```bash
   cd infrastructure
   ./setup-env.sh
   ```

3. **Démarrer les services**
   ```bash
   ./start-services.sh
   ```

4. **Vérifier que tout fonctionne**
   ```bash
   ./test-connection.sh
   ```

## 📁 Structure du Projet

```
cyber-cafe-management/
├── backend/
│   ├── api-gateway/          # Passerelle API
│   ├── auth-service/         # Service d'authentification
│   ├── clients-service/      # Service de gestion des clients
│   ├── computers-service/    # Service de gestion des ordinateurs
│   ├── reporting-service/    # Service de reporting
│   └── session-service/      # Service de gestion des sessions
├── frontend/                 # Interface utilisateur
├── infrastructure/           # Configuration Docker et base de données
│   ├── docker-compose.yml    # Configuration des services
│   ├── env.example          # Modèle de variables d'environnement
│   ├── setup-env.sh         # Script de configuration
│   ├── start-services.sh    # Script de démarrage
│   ├── stop-services.sh     # Script d'arrêt
│   └── test-connection.sh   # Script de test
└── README.md
```

## 🔧 Configuration

### Variables d'Environnement
Le fichier `infrastructure/env.example` contient toutes les variables de configuration nécessaires. Le script `setup-env.sh` crée automatiquement un fichier `.env` avec des valeurs par défaut sécurisées.

### Ports par Défaut
- **API Gateway** : 8000
- **Auth Service** : 8001
- **Clients Service** : 8002
- **Computers Service** : 8003
- **Sessions Service** : 8004
- **Reporting Service** : 8005
- **Auth DB** : 5432
- **Clients DB** : 5433
- **Computers DB** : 5434
- **Sessions DB** : 5435
- **Reporting DB** : 5436
- **Redis** : 6379

## 🛠️ Commandes Utiles

### Infrastructure
```bash
# Configuration initiale
cd infrastructure
./setup-env.sh

# Démarrage des services
./start-services.sh

# Arrêt des services
./stop-services.sh

# Test des connexions
./test-connection.sh

# Vérification du statut
docker-compose --env-file .env ps

# Visualisation des logs
docker-compose --env-file .env logs
```

### Développement
```bash
# Démarrer un service spécifique
docker-compose --env-file .env up auth-db

# Reconstruire les images
docker-compose --env-file .env build

# Nettoyer les conteneurs
docker-compose --env-file .env down -v
```

## 🔒 Sécurité

⚠️ **Important** : Cette configuration est destinée au développement uniquement.

Pour la production :
- Changez tous les mots de passe par défaut
- Utilisez des variables d'environnement sécurisées
- Activez l'authentification Redis
- Configurez des certificats SSL/TLS
- Utilisez des réseaux Docker appropriés

## 📚 Documentation

- [Documentation Infrastructure](infrastructure/README.md)
- [Documentation API](backend/api-gateway/README.md) (à venir)
- [Guide de Développement](docs/development.md) (à venir)

## 🤝 Contribution

1. Fork le projet
2. Créez une branche pour votre fonctionnalité
3. Committez vos changements
4. Poussez vers la branche
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
1. Consultez la documentation
2. Vérifiez les logs : `docker-compose --env-file .env logs`
3. Testez les connexions : `./test-connection.sh`
4. Ouvrez une issue sur GitHub
=======
# cyber-cafe-management
Ceci est une plateforme pour gerer les suivi des cyber cafés
>>>>>>> 1aa4d0960c17ac33e85c1d1ab08888f87c77a1d2
