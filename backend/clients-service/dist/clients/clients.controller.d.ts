import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientDto } from './dto/query-client.dto';
import { Client, ClientStatus } from './entities/client.entity';
export declare class ClientsController {
    private readonly clientsService;
    constructor(clientsService: ClientsService);
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
    getStatistics(): Promise<{
        totalClients: number;
        activeClients: number;
        vipClients: number;
        premiumClients: number;
        totalBalance: number;
        totalLoyaltyPoints: number;
    }>;
    findOne(id: string): Promise<Client>;
    findByUsername(username: string): Promise<Client>;
    findByEmail(email: string): Promise<Client>;
    update(id: string, updateClientDto: UpdateClientDto): Promise<Client>;
    updateStatus(id: string, status: ClientStatus): Promise<Client>;
    addBalance(id: string, amount: number): Promise<Client>;
    deductBalance(id: string, amount: number): Promise<Client>;
    addLoyaltyPoints(id: string, points: number): Promise<Client>;
    updateLastLogin(id: string): Promise<Client>;
    addSessionTime(id: string, minutes: number): Promise<Client>;
    remove(id: string): Promise<void>;
}
