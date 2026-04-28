import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiAuthRequired } from '../auth/decorators/api-auth.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { multerConfig } from '../common/cloudinary/multer.config';
import { CreateVehicleDto } from './dto/create-vehicule,dto';
import { VehicleResponseDto } from './dto/vehicule-response.dto';
import { VehiclesService } from './vehicles.service';
import { UpdateVehicleDto } from './dto/update-vehicule.dto';

@ApiTags('vehicles')
@ApiAuthRequired()
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @ApiOperation({ summary: 'Enregistrer un nouveau véhicule' })
  @ApiResponse({ status: 201, type: VehicleResponseDto })
  @ApiResponse({ status: 409, description: 'Plaque déjà enregistrée' })
  create(
    @Body() dto: CreateVehicleDto,
    @CurrentUser() user: User,
  ): Promise<VehicleResponseDto> {
    return this.vehiclesService.create(dto, user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Lister tous les véhicules actifs' })
  @ApiResponse({ status: 200, type: [VehicleResponseDto] })
  findAll(): Promise<VehicleResponseDto[]> {
    return this.vehiclesService.findAll();
  }

  @Get('my')
  @ApiOperation({ summary: 'Mes véhicules' })
  @ApiResponse({ status: 200, type: [VehicleResponseDto] })
  findMy(@CurrentUser() user: User): Promise<VehicleResponseDto[]> {
    return this.vehiclesService.findByOwner(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un véhicule' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: VehicleResponseDto })
  @ApiResponse({ status: 404, description: 'Véhicule introuvable' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<VehicleResponseDto> {
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un véhicule (propriétaire uniquement)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: VehicleResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
    @CurrentUser() user: User,
  ): Promise<VehicleResponseDto> {
    return this.vehiclesService.update(id, dto, user.id);
  }

  @Post(':id/photo')
  @ApiOperation({ summary: 'Uploader la photo du véhicule (Cloudinary)' })
  @ApiParam({ name: 'id', type: String })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'JPEG, PNG ou WebP — max 5 Mo',
        },
      },
    },
  })
  @ApiResponse({ status: 200, type: VehicleResponseDto })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  uploadPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ): Promise<VehicleResponseDto> {
    return this.vehiclesService.uploadPhoto(id, file, user.id);
  }

  @Delete(':id/photo')
  @ApiOperation({ summary: 'Supprimer la photo du véhicule' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: VehicleResponseDto })
  deletePhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<VehicleResponseDto> {
    return this.vehiclesService.deletePhoto(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un véhicule (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204 })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.vehiclesService.remove(id, user.id);
  }
}