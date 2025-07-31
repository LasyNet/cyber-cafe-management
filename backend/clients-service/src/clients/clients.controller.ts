import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientDto } from './dto/query-client.dto';
import { Client, ClientStatus } from './entities/client.entity';

@ApiTags('Clients')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau client' })
  @ApiResponse({ status: 201, description: 'Client créé avec succès', type: Client })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Nom d\'utilisateur ou email déjà utilisé' })
  async create(@Body() createClientDto: CreateClientDto): Promise<Client> {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les clients avec pagination et filtres' })
  @ApiResponse({ status: 200, description: 'Liste des clients récupérée avec succès' })
  async findAll(@Query() queryDto: QueryClientDto) {
    return this.clientsService.findAll(queryDto);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Récupérer les statistiques des clients' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  async getStatistics() {
    return this.clientsService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un client par ID' })
  @ApiParam({ name: 'id', description: 'ID du client' })
  @ApiResponse({ status: 200, description: 'Client récupéré avec succès', type: Client })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  async findOne(@Param('id') id: string): Promise<Client> {
    return this.clientsService.findOne(+id);
  }

  @Get('username/:username')
  @ApiOperation({ summary: 'Récupérer un client par nom d\'utilisateur' })
  @ApiParam({ name: 'username', description: 'Nom d\'utilisateur du client' })
  @ApiResponse({ status: 200, description: 'Client récupéré avec succès', type: Client })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  async findByUsername(@Param('username') username: string): Promise<Client> {
    return this.clientsService.findByUsername(username);
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Récupérer un client par email' })
  @ApiParam({ name: 'email', description: 'Email du client' })
  @ApiResponse({ status: 200, description: 'Client récupéré avec succès', type: Client })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  async findByEmail(@Param('email') email: string): Promise<Client> {
    return this.clientsService.findByEmail(email);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un client' })
  @ApiParam({ name: 'id', description: 'ID du client' })
  @ApiResponse({ status: 200, description: 'Client mis à jour avec succès', type: Client })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  @ApiResponse({ status: 409, description: 'Nom d\'utilisateur ou email déjà utilisé' })
  async update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto): Promise<Client> {
    return this.clientsService.update(+id, updateClientDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Mettre à jour le statut d\'un client' })
  @ApiParam({ name: 'id', description: 'ID du client' })
  @ApiResponse({ status: 200, description: 'Statut mis à jour avec succès', type: Client })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ClientStatus,
  ): Promise<Client> {
    return this.clientsService.updateStatus(+id, status);
  }

  @Patch(':id/balance/add')
  @ApiOperation({ summary: 'Ajouter du solde au compte d\'un client' })
  @ApiParam({ name: 'id', description: 'ID du client' })
  @ApiResponse({ status: 200, description: 'Solde ajouté avec succès', type: Client })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  async addBalance(
    @Param('id') id: string,
    @Body('amount') amount: number,
  ): Promise<Client> {
    return this.clientsService.updateBalance(+id, amount);
  }

  @Patch(':id/balance/deduct')
  @ApiOperation({ summary: 'Déduire du solde du compte d\'un client' })
  @ApiParam({ name: 'id', description: 'ID du client' })
  @ApiResponse({ status: 200, description: 'Solde déduit avec succès', type: Client })
  @ApiResponse({ status: 400, description: 'Solde insuffisant' })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  async deductBalance(
    @Param('id') id: string,
    @Body('amount') amount: number,
  ): Promise<Client> {
    return this.clientsService.deductBalance(+id, amount);
  }

  @Patch(':id/loyalty-points')
  @ApiOperation({ summary: 'Ajouter des points de fidélité à un client' })
  @ApiParam({ name: 'id', description: 'ID du client' })
  @ApiResponse({ status: 200, description: 'Points ajoutés avec succès', type: Client })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  async addLoyaltyPoints(
    @Param('id') id: string,
    @Body('points') points: number,
  ): Promise<Client> {
    return this.clientsService.addLoyaltyPoints(+id, points);
  }

  @Patch(':id/last-login')
  @ApiOperation({ summary: 'Mettre à jour la date de dernière connexion' })
  @ApiParam({ name: 'id', description: 'ID du client' })
  @ApiResponse({ status: 200, description: 'Date mise à jour avec succès', type: Client })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  async updateLastLogin(@Param('id') id: string): Promise<Client> {
    return this.clientsService.updateLastLogin(+id);
  }

  @Patch(':id/session-time')
  @ApiOperation({ summary: 'Ajouter du temps de session à un client' })
  @ApiParam({ name: 'id', description: 'ID du client' })
  @ApiResponse({ status: 200, description: 'Temps ajouté avec succès', type: Client })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  async addSessionTime(
    @Param('id') id: string,
    @Body('minutes') minutes: number,
  ): Promise<Client> {
    return this.clientsService.addSessionTime(+id, minutes);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un client' })
  @ApiParam({ name: 'id', description: 'ID du client' })
  @ApiResponse({ status: 204, description: 'Client supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.clientsService.remove(+id);
  }
} 