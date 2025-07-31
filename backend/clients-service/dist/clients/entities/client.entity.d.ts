export declare enum ClientStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended",
    BANNED = "banned"
}
export declare enum ClientType {
    REGULAR = "regular",
    VIP = "vip",
    PREMIUM = "premium"
}
export declare class Client {
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
    type: ClientType;
    status: ClientStatus;
    balance: number;
    loyaltyPoints: number;
    registrationDate: Date;
    lastLoginDate: Date;
    totalSessionTime: number;
    preferences: Record<string, any>;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
    getFullName(): string;
    isActive(): boolean;
    canUseService(): boolean;
    addLoyaltyPoints(points: number): void;
    deductBalance(amount: number): boolean;
    addBalance(amount: number): void;
}
