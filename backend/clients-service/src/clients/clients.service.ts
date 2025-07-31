import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Client, ClientStatus, ClientType } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientDto } from './dto/query-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    // Vérifier si le username existe déjà
    const existingUsername = await this.clientRepository.findOne({
      where: { username: createClientDto.username },
    });
    if (existingUsername) {
      throw new ConflictException('Ce nom d\'utilisateur est déjà utilisé');
    }

    // Vérifier si l'email existe déjà (si fourni)
    if (createClientDto.email) {
      const existingEmail = await this.clientRepository.findOne({
        where: { email: createClientDto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Cette adresse email est déjà utilisée');
      }
    }

    // Créer le nouveau client
    const client = this.clientRepository.create({
      ...createClientDto,
      registrationDate: new Date(),
      balance: createClientDto.balance || 0,
      loyaltyPoints: 0,
      status: ClientStatus.ACTIVE,
      type: createClientDto.type || ClientType.REGULAR,
    });

    return this.clientRepository.save(client);
  }

  async findAll(queryDto: QueryClientDto) {
    const { search, type, status, city, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = queryDto;
    
    const queryBuilder = this.clientRepository.createQueryBuilder('client');

    // Appliquer les filtres
    if (search) {
      queryBuilder.where(
        '(client.firstName ILIKE :search OR client.lastName ILIKE :search OR client.email ILIKE :search OR client.username ILIKE :search)',
        { search: `%${search}%` }
      );
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

    // Appliquer le tri
    queryBuilder.orderBy(`client.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    // Appliquer la pagination
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

  async findOne(id: number): Promise<Client> {
    const client = await this.clientRepository.findOne({ where: { id } });
    if (!client) {
      throw new NotFoundException(`Client avec l'ID ${id} non trouvé`);
    }
    return client;
  }

  async findByUsername(username: string): Promise<Client> {
    const client = await this.clientRepository.findOne({ where: { username } });
    if (!client) {
      throw new NotFoundException(`Client avec le nom d'utilisateur ${username} non trouvé`);
    }
    return client;
  }

  async findByEmail(email: string): Promise<Client> {
    const client = await this.clientRepository.findOne({ where: { email } });
    if (!client) {
      throw new NotFoundException(`Client avec l'email ${email} non trouvé`);
    }
    return client;
  }

  async update(id: number, updateClientDto: UpdateClientDto): Promise<Client> {
    const client = await this.findOne(id);

    // Vérifier les conflits de username/email si modifiés
    if (updateClientDto.username && updateClientDto.username !== client.username) {
      const existingUsername = await this.clientRepository.findOne({
        where: { username: updateClientDto.username },
      });
      if (existingUsername) {
        throw new ConflictException('Ce nom d\'utilisateur est déjà utilisé');
      }
    }

    if (updateClientDto.email && updateClientDto.email !== client.email) {
      const existingEmail = await this.clientRepository.findOne({
        where: { email: updateClientDto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Cette adresse email est déjà utilisée');
      }
    }

    Object.assign(client, updateClientDto);
    return this.clientRepository.save(client);
  }

  async remove(id: number): Promise<void> {
    const client = await this.findOne(id);
    await this.clientRepository.remove(client);
  }

  async updateStatus(id: number, status: ClientStatus): Promise<Client> {
    const client = await this.findOne(id);
    client.status = status;
    return this.clientRepository.save(client);
  }

  async updateBalance(id: number, amount: number): Promise<Client> {
    const client = await this.findOne(id);
    client.addBalance(amount);
    return this.clientRepository.save(client);
  }

  async deductBalance(id: number, amount: number): Promise<Client> {
    const client = await this.findOne(id);
    const success = client.deductBalance(amount);
    if (!success) {
      throw new BadRequestException('Solde insuffisant');
    }
    return this.clientRepository.save(client);
  }

  async addLoyaltyPoints(id: number, points: number): Promise<Client> {
    const client = await this.findOne(id);
    client.addLoyaltyPoints(points);
    return this.clientRepository.save(client);
  }

  async updateLastLogin(id: number): Promise<Client> {
    const client = await this.findOne(id);
    client.lastLoginDate = new Date();
    return this.clientRepository.save(client);
  }

  async addSessionTime(id: number, minutes: number): Promise<Client> {
    const client = await this.findOne(id);
    client.totalSessionTime += minutes;
    return this.clientRepository.save(client);
  }

  async getStatistics() {
    const totalClients = await this.clientRepository.count();
    const activeClients = await this.clientRepository.count({ where: { status: ClientStatus.ACTIVE } });
    const vipClients = await this.clientRepository.count({ where: { type: ClientType.VIP } });
    const premiumClients = await this.clientRepository.count({ where: { type: ClientType.PREMIUM } });

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
} 