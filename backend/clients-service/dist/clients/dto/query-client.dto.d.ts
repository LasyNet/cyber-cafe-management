import { ClientType, ClientStatus } from '../entities/client.entity';
export declare class QueryClientDto {
    search?: string;
    type?: ClientType;
    status?: ClientStatus;
    city?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
