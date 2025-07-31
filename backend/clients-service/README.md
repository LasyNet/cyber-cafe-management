# Service de Gestion des Clients - Cyber Café

Service NestJS pour la gestion des clients et comptes du cyber café.

## 🏗️ Architecture

- **Framework** : NestJS avec TypeScript
- **Base de données** : PostgreSQL avec TypeORM
- **Documentation** : Swagger/OpenAPI
- **Validation** : class-validator
- **Port** : 8002

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- Docker et Docker Compose
- Base de données PostgreSQL

### Installation

1. **Installer les dépendances**
   ```bash
   npm install
   ```

2. **Configuration de l'environnement**
   ```bash
   cp env.example .env
   # Modifier les variables selon votre configuration
   ```

3. **Développement**
   ```bash
   npm run start:dev
   ```

4. **Production**
   ```bash
   npm run build
   npm run start:prod
   ```

## 📋 Fonctionnalités

### Gestion des Clients
- ✅ Création de clients
- ✅ Mise à jour des informations
- ✅ Suppression de clients
- ✅ Recherche et filtrage
- ✅ Pagination

### Gestion des Comptes
- ✅ Solde du compte
- ✅ Points de fidélité
- ✅ Types de clients (Regular, VIP, Premium)
- ✅ Statuts (Active, Inactive, Suspended, Banned)

### Statistiques
- ✅ Statistiques globales
- ✅ Comptage par type/statut
- ✅ Totaux des soldes et points

## 🔗 Endpoints API

### Clients
- `GET /api/v1/clients` - Liste des clients avec pagination
- `POST /api/v1/clients` - Créer un client
- `GET /api/v1/clients/:id` - Récupérer un client par ID
- `PATCH /api/v1/clients/:id` - Mettre à jour un client
- `DELETE /api/v1/clients/:id` - Supprimer un client

### Recherche
- `GET /api/v1/clients/username/:username` - Par nom d'utilisateur
- `GET /api/v1/clients/email/:email` - Par email

### Gestion des Comptes
- `PATCH /api/v1/clients/:id/balance/add` - Ajouter du solde
- `PATCH /api/v1/clients/:id/balance/deduct` - Déduire du solde
- `PATCH /api/v1/clients/:id/loyalty-points` - Ajouter des points
- `PATCH /api/v1/clients/:id/status` - Changer le statut

### Statistiques
- `GET /api/v1/clients/statistics` - Statistiques globales

## 📊 Modèle de Données

### Client Entity
```typescript
{
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: Date;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  type: ClientType; // regular, vip, premium
  status: ClientStatus; // active, inactive, suspended, banned
  balance: number;
  loyaltyPoints: number;
  registrationDate: Date;
  lastLoginDate: Date;
  totalSessionTime: number;
  preferences: Record<string, any>;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔧 Configuration

### Variables d'Environnement
```env
# Base de données
CLIENTS_DB_HOST=localhost
CLIENTS_DB_PORT=5433
POSTGRES_USER=user
POSTGRES_PASSWORD=password
CLIENTS_DB_NAME=clients_db

# Service
CLIENTS_SERVICE_PORT=8002
NODE_ENV=development

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

## 🧪 Tests

### Tests Automatiques
```bash
npm run test
npm run test:watch
npm run test:cov
```

### Tests Manuels
```bash
# Depuis le dossier infrastructure
./test-clients-service.sh
```

## 📚 Documentation

- **Swagger UI** : http://localhost:8002/docs
- **OpenAPI JSON** : http://localhost:8002/api-json

## 🐳 Docker

### Construction
```bash
docker build -t cyber-cafe-clients-service .
```

### Exécution
```bash
docker run -p 8002:8002 cyber-cafe-clients-service
```

### Avec Docker Compose
```bash
# Depuis le dossier infrastructure
docker-compose up clients-service
```

## 🔒 Sécurité

- Validation des données avec class-validator
- Gestion des erreurs centralisée
- Logs structurés
- CORS configuré
- Validation des types TypeScript

## 📈 Monitoring

- Logs structurés
- Métriques de performance
- Gestion des erreurs
- Health checks

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature
3. Committer les changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📄 Licence

MIT License 