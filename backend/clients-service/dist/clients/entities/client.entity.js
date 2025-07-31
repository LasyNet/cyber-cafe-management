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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = exports.ClientType = exports.ClientStatus = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
var ClientStatus;
(function (ClientStatus) {
    ClientStatus["ACTIVE"] = "active";
    ClientStatus["INACTIVE"] = "inactive";
    ClientStatus["SUSPENDED"] = "suspended";
    ClientStatus["BANNED"] = "banned";
})(ClientStatus || (exports.ClientStatus = ClientStatus = {}));
var ClientType;
(function (ClientType) {
    ClientType["REGULAR"] = "regular";
    ClientType["VIP"] = "vip";
    ClientType["PREMIUM"] = "premium";
})(ClientType || (exports.ClientType = ClientType = {}));
let Client = class Client {
    getFullName() {
        return `${this.firstName} ${this.lastName}`;
    }
    isActive() {
        return this.status === ClientStatus.ACTIVE;
    }
    canUseService() {
        return this.status !== ClientStatus.BANNED && this.status !== ClientStatus.SUSPENDED;
    }
    addLoyaltyPoints(points) {
        this.loyaltyPoints += points;
    }
    deductBalance(amount) {
        if (this.balance >= amount) {
            this.balance -= amount;
            return true;
        }
        return false;
    }
    addBalance(amount) {
        this.balance += amount;
    }
};
exports.Client = Client;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID unique du client' }),
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Client.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nom d\'utilisateur unique' }),
    (0, typeorm_1.Column)({ unique: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Client.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Adresse email' }),
    (0, typeorm_1.Column)({ unique: true, nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Client.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Prénom du client' }),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Client.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nom de famille du client' }),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Client.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Numéro de téléphone' }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Client.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date de naissance' }),
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Client.prototype, "dateOfBirth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Adresse du client' }),
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Client.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Ville' }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Client.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Code postal' }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Client.prototype, "postalCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Pays' }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Client.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Type de client', enum: ClientType }),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ClientType,
        default: ClientType.REGULAR,
    }),
    __metadata("design:type", String)
], Client.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Statut du client', enum: ClientStatus }),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ClientStatus,
        default: ClientStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], Client.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Solde du compte en euros' }),
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Client.prototype, "balance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Points de fidélité' }),
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Client.prototype, "loyaltyPoints", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date d\'inscription' }),
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Client.prototype, "registrationDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date de dernière connexion' }),
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Client.prototype, "lastLoginDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Temps total de connexion en minutes' }),
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Client.prototype, "totalSessionTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Préférences du client (JSON)' }),
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Client.prototype, "preferences", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Notes sur le client' }),
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Client.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date de création' }),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Client.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date de dernière modification' }),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Client.prototype, "updatedAt", void 0);
exports.Client = Client = __decorate([
    (0, typeorm_1.Entity)('clients')
], Client);
//# sourceMappingURL=client.entity.js.map