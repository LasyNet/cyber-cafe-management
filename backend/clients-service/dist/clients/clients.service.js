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
exports.ClientsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const client_entity_1 = require("./entities/client.entity");
let ClientsService = class ClientsService {
    constructor(clientRepository) {
        this.clientRepository = clientRepository;
    }
    async create(createClientDto) {
        const existingUsername = await this.clientRepository.findOne({
            where: { username: createClientDto.username },
        });
        if (existingUsername) {
            throw new common_1.ConflictException('Ce nom d\'utilisateur est déjà utilisé');
        }
        if (createClientDto.email) {
            const existingEmail = await this.clientRepository.findOne({
                where: { email: createClientDto.email },
            });
            if (existingEmail) {
                throw new common_1.ConflictException('Cette adresse email est déjà utilisée');
            }
        }
        const client = this.clientRepository.create({
            ...createClientDto,
            registrationDate: new Date(),
            balance: createClientDto.balance || 0,
            loyaltyPoints: 0,
            status: client_entity_1.ClientStatus.ACTIVE,
            type: createClientDto.type || client_entity_1.ClientType.REGULAR,
        });
        return this.clientRepository.save(client);
    }
    async findAll(queryDto) {
        const { search, type, status, city, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = queryDto;
        const queryBuilder = this.clientRepository.createQueryBuilder('client');
        if (search) {
            queryBuilder.where('(client.firstName ILIKE :search OR client.lastName ILIKE :search OR client.email ILIKE :search OR client.username ILIKE :search)', { search: `%${search}%` });
        }
        if (type) {
            queryBuilder.andWhere('client.type = :type', { type });
        }
        if (status) {
            queryBuilder.andWhere('client.status = :status', { status });
        }
        if (city) {
            queryBuilder.andWhere('client.city ILIKE :city', { city: `%${city}%` });
        }
        queryBuilder.orderBy(`client.${sortBy}`, sortOrder.toUpperCase());
        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);
        const [clients, total] = await queryBuilder.getManyAndCount();
        return {
            clients,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const client = await this.clientRepository.findOne({ where: { id } });
        if (!client) {
            throw new common_1.NotFoundException(`Client avec l'ID ${id} non trouvé`);
        }
        return client;
    }
    async findByUsername(username) {
        const client = await this.clientRepository.findOne({ where: { username } });
        if (!client) {
            throw new common_1.NotFoundException(`Client avec le nom d'utilisateur ${username} non trouvé`);
        }
        return client;
    }
    async findByEmail(email) {
        const client = await this.clientRepository.findOne({ where: { email } });
        if (!client) {
            throw new common_1.NotFoundException(`Client avec l'email ${email} non trouvé`);
        }
        return client;
    }
    async update(id, updateClientDto) {
        const client = await this.findOne(id);
        if (updateClientDto.username && updateClientDto.username !== client.username) {
            const existingUsername = await this.clientRepository.findOne({
                where: { username: updateClientDto.username },
            });
            if (existingUsername) {
                throw new common_1.ConflictException('Ce nom d\'utilisateur est déjà utilisé');
            }
        }
        if (updateClientDto.email && updateClientDto.email !== client.email) {
            const existingEmail = await this.clientRepository.findOne({
                where: { email: updateClientDto.email },
            });
            if (existingEmail) {
                throw new common_1.ConflictException('Cette adresse email est déjà utilisée');
            }
        }
        Object.assign(client, updateClientDto);
        return this.clientRepository.save(client);
    }
    async remove(id) {
        const client = await this.findOne(id);
        await this.clientRepository.remove(client);
    }
    async updateStatus(id, status) {
        const client = await this.findOne(id);
        client.status = status;
        return this.clientRepository.save(client);
    }
    async updateBalance(id, amount) {
        const client = await this.findOne(id);
        client.addBalance(amount);
        return this.clientRepository.save(client);
    }
    async deductBalance(id, amount) {
        const client = await this.findOne(id);
        const success = client.deductBalance(amount);
        if (!success) {
            throw new common_1.BadRequestException('Solde insuffisant');
        }
        return this.clientRepository.save(client);
    }
    async addLoyaltyPoints(id, points) {
        const client = await this.findOne(id);
        client.addLoyaltyPoints(points);
        return this.clientRepository.save(client);
    }
    async updateLastLogin(id) {
        const client = await this.findOne(id);
        client.lastLoginDate = new Date();
        return this.clientRepository.save(client);
    }
    async addSessionTime(id, minutes) {
        const client = await this.findOne(id);
        client.totalSessionTime += minutes;
        return this.clientRepository.save(client);
    }
    async getStatistics() {
        const totalClients = await this.clientRepository.count();
        const activeClients = await this.clientRepository.count({ where: { status: client_entity_1.ClientStatus.ACTIVE } });
        const vipClients = await this.clientRepository.count({ where: { type: client_entity_1.ClientType.VIP } });
        const premiumClients = await this.clientRepository.count({ where: { type: client_entity_1.ClientType.PREMIUM } });
        const totalBalance = await this.clientRepository
            .createQueryBuilder('client')
            .select('SUM(client.balance)', 'total')
            .getRawOne();
        const totalLoyaltyPoints = await this.clientRepository
            .createQueryBuilder('client')
            .select('SUM(client.loyaltyPoints)', 'total')
            .getRawOne();
        return {
            totalClients,
            activeClients,
            vipClients,
            premiumClients,
            totalBalance: parseFloat(totalBalance.total) || 0,
            totalLoyaltyPoints: parseInt(totalLoyaltyPoints.total) || 0,
        };
    }
};
exports.ClientsService = ClientsService;
exports.ClientsService = ClientsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(client_entity_1.Client)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ClientsService);
//# sourceMappingURL=clients.service.js.map