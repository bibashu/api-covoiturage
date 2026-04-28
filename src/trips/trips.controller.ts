import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query,
  ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiParam,
} from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { SearchTripDto } from './dto/search-trip.dto';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiAuthRequired } from '../auth/decorators/api-auth.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '../users/entities/user.entity';
import { TripResponseDto } from './dto/response-trip.dto';

@ApiTags('trips')
@ApiAuthRequired()
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  @ApiOperation({ summary: 'Publier un nouveau trajet' })
  @ApiResponse({ status: 201, type: TripResponseDto })
  @ApiResponse({ status: 400, description: 'Date invalide ou places incohérentes' })
  @ApiResponse({ status: 403, description: 'Véhicule non autorisé' })
  create(
    @Body() dto: CreateTripDto,
    @CurrentUser() user: User,
  ): Promise<TripResponseDto> {
    return this.tripsService.create(dto, user.id);
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Rechercher des trajets (public)' })
  @ApiResponse({ status: 200, description: 'Liste paginée de trajets' })
  search(@Query() query: SearchTripDto) {
    return this.tripsService.search(query);
  }

  @Get('my')
  @ApiOperation({ summary: 'Mes trajets en tant que conducteur' })
  @ApiResponse({ status: 200, type: [TripResponseDto] })
  findMy(@CurrentUser() user: User): Promise<TripResponseDto[]> {
    return this.tripsService.findByDriver(user.id);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un trajet (public)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: TripResponseDto })
  @ApiResponse({ status: 404, description: 'Trajet introuvable' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<TripResponseDto> {
    return this.tripsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un trajet (conducteur uniquement)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: TripResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTripDto,
    @CurrentUser() user: User,
  ): Promise<TripResponseDto> {
    return this.tripsService.update(id, dto, user.id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Annuler un trajet' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: TripResponseDto })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<TripResponseDto> {
    return this.tripsService.cancel(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un trajet (brouillon uniquement)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204 })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.tripsService.remove(id, user.id);
  }
}