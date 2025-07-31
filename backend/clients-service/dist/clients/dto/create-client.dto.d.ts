import { ClientType } from '../entities/client.entity';
export declare class CreateClientDto {
    username: string;
    email?: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    type?: ClientType;
    balance?: number;
    preferences?: Record<string, any>;
    notes?: string;
}
