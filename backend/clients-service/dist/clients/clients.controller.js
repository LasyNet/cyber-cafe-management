"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const clients_service_1 = require("./clients.service");
const create_client_dto_1 = require("./dto/create-client.dto");
const update_client_dto_1 = require("./dto/update-client.dto");
const query_client_dto_1 = require("./dto/query-client.dto");
const client_entity_1 = require("./entities/client.entity");
let ClientsController = class ClientsController {
    constructor(clientsService) {
        this.clientsService = clientsService;
    }
    async create(createClientDto) {
        return this.clientsService.create(createClientDto);
    }
    async findAll(queryDto) {
        return this.clientsService.findAll(queryDto);
    }
    async getStatistics() {
        return this.clientsService.getStatistics();
    }
    async findOne(id) {
        return this.clientsService.findOne(+id);
    }
    async findByUsername(username) {
        return this.clientsService.findByUsername(username);
    }
    async findByEmail(email) {
        return this.clientsService.findByEmail(email);
    }
    async update(id, updateClientDto) {
        return this.clientsService.update(+id, updateClientDto);
    }
    async updateStatus(id, status) {
        return this.clientsService.updateStatus(+id, status);
    }
    async addBalance(id, amount) {
        return this.clientsService.updateBalance(+id, amount);
    }
    async deductBalance(id, amount) {
        return this.clientsService.deductBalance(+id, amount);
    }
    async addLoyaltyPoints(id, points) {
        return this.clientsService.addLoyaltyPoints(+id, points);
    }
    async updateLastLogin(id) {
        return this.clientsService.updateLastLogin(+id);
    }
    async addSessionTime(id, minutes) {
        return this.clientsService.addSessionTime(+id, minutes);
    }
    async remove(id) {
        return this.clientsService.remove(+id);
    }
};
exports.ClientsController = ClientsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Créer un nouveau client' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Client créé avec succès', type: client_entity_1.Client }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Données invalides' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Nom d\'utilisateur ou email déjà utilisé' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_client_dto_1.CreateClientDto]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Récupérer tous les clients avec pagination et filtres' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Liste des clients récupérée avec succès' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_client_dto_1.QueryClientDto]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, swagger_1.ApiOperation)({ summary: 'Récupérer les statistiques des clients' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Statistiques récupérées avec succès' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Récupérer un client par ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID du client' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Client récupéré avec succès', type: client_entity_1.Client }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Client non trouvé' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('username/:username'),
    (0, swagger_1.ApiOperation)({ summary: 'Récupérer un client par nom d\'utilisateur' }),
    (0, swagger_1.ApiParam)({ name: 'username', description: 'Nom d\'utilisateur du client' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Client récupéré avec succès', type: client_entity_1.Client }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Client non trouvé' }),
    __param(0, (0, common_1.Param)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "findByUsername", null);
__decorate([
    (0, common_1.Get)('email/:email'),
    (0, swagger_1.ApiOperation)({ summary: 'Récupérer un client par email' }),
    (0, swagger_1.ApiParam)({ name: 'email', description: 'Email du client' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Client récupéré avec succès', type: client_entity_1.Client }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Client non trouvé' }),
    __param(0, (0, common_1.Param)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "findByEmail", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Mettre à jour un client' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID du client' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Client mis à jour avec succès', type: client_entity_1.Client }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Client non trouvé' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Nom d\'utilisateur ou email déjà utilisé' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_client_dto_1.UpdateClientDto]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Mettre à jour le statut d\'un client' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID du client' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Statut mis à jour avec succès', type: client_entity_1.Client }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Client non trouvé' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id/balance/add'),
    (0, swagger_1.ApiOperation)({ summary: 'Ajouter du solde au compte d\'un client' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID du client' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Solde ajouté avec succès', type: client_entity_1.Client }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Client non trouvé' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('amount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "addBalance", null);
__decorate([
    (0, common_1.Patch)(':id/balance/deduct'),
    (0, swagger_1.ApiOperation)({ summary: 'Déduire du solde du compte d\'un client' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID du client' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Solde déduit avec succès', type: client_entity_1.Client }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Solde insuffisant' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Client non trouvé' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('amount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "deductBalance", null);
__decorate([
    (0, common_1.Patch)(':id/loyalty-points'),
    (0, swagger_1.ApiOperation)({ summary: 'Ajouter des points de fidélité à un client' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID du client' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Points ajoutés avec succès', type: client_entity_1.Client }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Client non trouvé' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('points')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "addLoyaltyPoints", null);
__decorate([
    (0, common_1.Patch)(':id/last-login'),
    (0, swagger_1.ApiOperation)({ summary: 'Mettre à jour la date de dernière connexion' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID du client' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Date mise à jour avec succès', type: client_entity_1.Client }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Client non trouvé' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "updateLastLogin", null);
__decorate([
    (0, common_1.Patch)(':id/session-time'),
    (0, swagger_1.ApiOperation)({ summary: 'Ajouter du temps de session à un client' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID du client' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Temps ajouté avec succès', type: client_entity_1.Client }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Client non trouvé' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('minutes')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "addSessionTime", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Supprimer un client' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID du client' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Client supprimé avec succès' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Client non trouvé' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "remove", null);
exports.ClientsController = ClientsController = __decorate([
    (0, swagger_1.ApiTags)('Clients'),
    (0, common_1.Controller)('clients'),
    __metadata("design:paramtypes", [clients_service_1.ClientsService])
], ClientsController);
//# sourceMappingURL=clients.controller.js.map