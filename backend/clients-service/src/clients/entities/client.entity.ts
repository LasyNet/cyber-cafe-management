import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum ClientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

export enum ClientType {
  REGULAR = 'regular',
  VIP = 'vip',
  PREMIUM = 'premium',
}

@Entity('clients')
export class Client {
  @ApiProperty({ description: 'ID unique du client' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Nom d\'utilisateur unique' })
  @Column({ unique: true })
  @Index()
  username: string;

  @ApiProperty({ description: 'Adresse email' })
  @Column({ unique: true, nullable: true })
  @Index()
  email: string;

  @ApiProperty({ description: 'Prénom du client' })
  @Column()
  firstName: string;

  @ApiProperty({ description: 'Nom de famille du client' })
  @Column()
  lastName: string;

  @ApiProperty({ description: 'Numéro de téléphone' })
  @Column({ nullable: true })
  phone: string;

  @ApiProperty({ description: 'Date de naissance' })
  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @ApiProperty({ description: 'Adresse du client' })
  @Column({ type: 'text', nullable: true })
  address: string;

  @ApiProperty({ description: 'Ville' })
  @Column({ nullable: true })
  city: string;

  @ApiProperty({ description: 'Code postal' })
  @Column({ nullable: true })
  postalCode: string;

  @ApiProperty({ description: 'Pays' })
  @Column({ nullable: true })
  country: string;

  @ApiProperty({ description: 'Type de client', enum: ClientType })
  @Column({
    type: 'enum',
    enum: ClientType,
    default: ClientType.REGULAR,
  })
  type: ClientType;

  @ApiProperty({ description: 'Statut du client', enum: ClientStatus })
  @Column({
    type: 'enum',
    enum: ClientStatus,
    default: ClientStatus.ACTIVE,
  })
  status: ClientStatus;

  @ApiProperty({ description: 'Solde du compte en euros' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @ApiProperty({ description: 'Points de fidélité' })
  @Column({ type: 'int', default: 0 })
  loyaltyPoints: number;

  @ApiProperty({ description: 'Date d\'inscription' })
  @Column({ type: 'date' })
  registrationDate: Date;

  @ApiProperty({ description: 'Date de dernière connexion' })
  @Column({ type: 'timestamp', nullable: true })
  lastLoginDate: Date;

  @ApiProperty({ description: 'Temps total de connexion en minutes' })
  @Column({ type: 'int', default: 0 })
  totalSessionTime: number;

  @ApiProperty({ description: 'Préférences du client (JSON)' })
  @Column({ type: 'jsonb', nullable: true })
  preferences: Record<string, any>;

  @ApiProperty({ description: 'Notes sur le client' })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ description: 'Date de création' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Date de dernière modification' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Méthodes utilitaires
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  isActive(): boolean {
    return this.status === ClientStatus.ACTIVE;
  }

  canUseService(): boolean {
    return this.status !== ClientStatus.BANNED && this.status !== ClientStatus.SUSPENDED;
  }

  addLoyaltyPoints(points: number): void {
    this.loyaltyPoints += points;
  }

  deductBalance(amount: number): boolean {
    if (this.balance >= amount) {
      this.balance -= amount;
      return true;
    }
    return false;
  }

  addBalance(amount: number): void {
    this.balance += amount;
  }
} 