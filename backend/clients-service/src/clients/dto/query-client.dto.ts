import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ClientType, ClientStatus } from '../entities/client.entity';

export class QueryClientDto {
  @ApiProperty({ description: 'Recherche par nom, prénom ou email', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Type de client', enum: ClientType, required: false })
  @IsOptional()
  @IsEnum(ClientType)
  type?: ClientType;

  @ApiProperty({ description: 'Statut du client', enum: ClientStatus, required: false })
  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;

  @ApiProperty({ description: 'Ville', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'Page (défaut: 1)', required: false })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Nombre d\'éléments par page (défaut: 10, max: 100)', required: false })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({ description: 'Tri par champ (défaut: createdAt)', required: false })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiProperty({ description: 'Ordre de tri (asc/desc, défaut: desc)', required: false })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
} 