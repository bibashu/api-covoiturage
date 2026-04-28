import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Vehicle } from './entities/vehicule.entity';

import { CloudinaryService } from '../common/cloudinary/cloudinary.service';

import { CreateVehicleDto } from './dto/create-vehicule,dto';
import { VehicleResponseDto } from './dto/vehicule-response.dto';
import { UpdateVehicleDto } from './dto/update-vehicule.dto';

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ─── CREATE ───────────────────────────────────────────────────────────────

  async create(
    dto: CreateVehicleDto,
    ownerId: string,
  ): Promise<VehicleResponseDto> {
    const exists = await this.vehicleRepo.findOne({
      where: { licensePlate: dto.licensePlate },
    });
    if (exists) {
      throw new ConflictException(
        `La plaque d'immatriculation "${dto.licensePlate}" est déjà enregistrée.`,
      );
    }

    const vehicle = this.vehicleRepo.create({ ...dto, ownerId });
    const saved = await this.vehicleRepo.save(vehicle);
    this.logger.log(`Véhicule créé : ${saved.id} par ${ownerId}`);
    return this.toDto(saved);
  }

  // ─── READ ─────────────────────────────────────────────────────────────────

  async findAll(): Promise<VehicleResponseDto[]> {
    const vehicles = await this.vehicleRepo.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
    return vehicles.map((v) => this.toDto(v));
  }

  async findByOwner(ownerId: string): Promise<VehicleResponseDto[]> {
    const vehicles = await this.vehicleRepo.find({
      where: { ownerId, isActive: true },
      order: { createdAt: 'DESC' },
    });
    return vehicles.map((v) => this.toDto(v));
  }

  async findOne(id: string): Promise<VehicleResponseDto> {
    const vehicle = await this.findOneOrFail(id);
    return this.toDto(vehicle);
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateVehicleDto,
    requesterId: string,
  ): Promise<VehicleResponseDto> {
    const vehicle = await this.findOneOrFail(id);
    this.assertOwner(vehicle, requesterId);

    if (dto.licensePlate && dto.licensePlate !== vehicle.licensePlate) {
      const exists = await this.vehicleRepo.findOne({
        where: { licensePlate: dto.licensePlate },
      });
      if (exists) {
        throw new ConflictException(
          `La plaque "${dto.licensePlate}" est déjà utilisée.`,
        );
      }
    }

    Object.assign(vehicle, dto);
    const saved = await this.vehicleRepo.save(vehicle);
    return this.toDto(saved);
  }

  // ─── PHOTO ────────────────────────────────────────────────────────────────

  async uploadPhoto(
    id: string,
    file: Express.Multer.File,
    requesterId: string,
  ): Promise<VehicleResponseDto> {
    const vehicle = await this.findOneOrFail(id);
    this.assertOwner(vehicle, requesterId);

    if (vehicle.photoPublicId) {
      await this.cloudinaryService.deletePhoto(vehicle.photoPublicId);
    }

    const result = await this.cloudinaryService.uploadVehiclePhoto(
      file,
      id,
    );

    vehicle.photoUrl = result.secureUrl;
    vehicle.photoPublicId = result.publicId;
    const saved = await this.vehicleRepo.save(vehicle);

    this.logger.log(`Photo véhicule mise à jour : ${id}`);
    return this.toDto(saved);
  }

  async deletePhoto(
    id: string,
    requesterId: string,
  ): Promise<VehicleResponseDto> {
    const vehicle = await this.findOneOrFail(id);
    this.assertOwner(vehicle, requesterId);

    if (vehicle.photoPublicId) {
      await this.cloudinaryService.deletePhoto(vehicle.photoPublicId);
    }

    vehicle.photoUrl = null as unknown as string;
    vehicle.photoPublicId = null as unknown as string;
    const saved = await this.vehicleRepo.save(vehicle);
    return this.toDto(saved);
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────

  async remove(id: string, requesterId: string): Promise<void> {
    const vehicle = await this.findOneOrFail(id);
    this.assertOwner(vehicle, requesterId);

    if (vehicle.photoPublicId) {
      await this.cloudinaryService.deletePhoto(vehicle.photoPublicId);
    }

    vehicle.isActive = false;
    await this.vehicleRepo.save(vehicle);
    this.logger.log(`Véhicule désactivé : ${id}`);
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  async findOneOrFail(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepo.findOne({
      where: { id, isActive: true },
    });
    if (!vehicle) {
      throw new NotFoundException(`Véhicule ${id} introuvable.`);
    }
    return vehicle;
  }

  private assertOwner(vehicle: Vehicle, requesterId: string): void {
    if (vehicle.ownerId !== requesterId) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres véhicules.',
      );
    }
  }

  private toDto(vehicle: Vehicle): VehicleResponseDto {
    return plainToInstance(VehicleResponseDto, vehicle, {
      excludeExtraneousValues: true,
    });
  }
}