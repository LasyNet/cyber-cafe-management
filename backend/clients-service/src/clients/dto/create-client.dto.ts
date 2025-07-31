import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsDateString, IsEnum, Min, MaxLength } from 'class-validator';
import { ClientType, ClientStatus } from '../entities/client.entity';

export class CreateClientDto {
  @ApiProperty({ description: 'Nom d\'utilisateur unique' })
  @IsString()
  @MaxLength(50)
  username: string;

  @ApiProperty({ description: 'Adresse email', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Prénom du client' })
  @IsString()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ description: 'Nom de famille du client' })
  @IsString()
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ description: 'Numéro de téléphone', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ description: 'Date de naissance (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({ description: 'Adresse du client', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiProperty({ description: 'Ville', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiProperty({ description: 'Code postal', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  postalCode?: string;

  @ApiProperty({ description: 'Pays', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiProperty({ description: 'Type de client', enum: ClientType, required: false })
  @IsOptional()
  @IsEnum(ClientType)
  type?: ClientType;

  @ApiProperty({ description: 'Solde initial du compte', required: false })
  @IsOptional()
  @Min(0)
  balance?: number;

  @ApiProperty({ description: 'Préférences du client (JSON)', required: false })
  @IsOptional()
  preferences?: Record<string, any>;

  @ApiProperty({ description: 'Notes sur le client', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
} 