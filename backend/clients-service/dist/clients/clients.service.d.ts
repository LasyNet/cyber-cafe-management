import { Repository } from 'typeorm';
import { Client, ClientStatus } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientDto } from './dto/query-client.dto';
export declare class ClientsService {
    private readonly clientRepository;
    constructor(clientRepository: Repository<Client>);
    create(createClientDto: CreateClientDto): Promise<Client>;
    findAll(queryDto: QueryClientDto): Promise<{
        clients: Client[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: number): Promise<Client>;
    findByUsername(username: string): Promise<Client>;
    findByEmail(email: string): Promise<Client>;
    update(id: number, updateClientDto: UpdateClientDto): Promise<Client>;
    remove(id: number): Promise<void>;
    updateStatus(id: number, status: ClientStatus): Promise<Client>;
    updateBalance(id: number, amount: number): Promise<Client>;
    deductBalance(id: number, amount: number): Promise<Client>;
    addLoyaltyPoints(id: number, points: number): Promise<Client>;
    updateLastLogin(id: number): Promise<Client>;
    addSessionTime(id: number, minutes: number): Promise<Client>;
    getStatistics(): Promise<{
        totalClients: number;
        activeClients: number;
        vipClients: number;
        premiumClients: number;
        totalBalance: number;
        totalLoyaltyPoints: number;
    }>;
}
