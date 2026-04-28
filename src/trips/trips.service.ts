import {
  Injectable, NotFoundException,
  ForbiddenException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, ILike } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Trip, TripStatus } from './entities/trips.entity';
import { TripStop } from './entities/trip-stop.entity';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { SearchTripDto } from './dto/search-trip.dto';

import { VehiclesService } from '../vehicles/vehicles.service';
import { TripResponseDto } from './dto/response-trip.dto';

export interface PaginatedTrips {
  data: TripResponseDto[];
  total: number;
  page: number;
  lastPage: number;
}

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);

  constructor(
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,
    @InjectRepository(TripStop)
    private readonly stopRepo: Repository<TripStop>,
    private readonly vehiclesService: VehiclesService,
  ) {}

  // ─── CREATE ───────────────────────────────────────────────────────────────

  async create(dto: CreateTripDto, driverId: string): Promise<TripResponseDto> {
    // Vérifie que le véhicule appartient bien au conducteur
    const vehicle = await this.vehiclesService.findOneOrFail(dto.vehicleId);
    if (vehicle.ownerId !== driverId) {
      throw new ForbiddenException(
        'Vous ne pouvez utiliser que vos propres véhicules.',
      );
    }

    // Vérifie que la date de départ est dans le futur
    if (new Date(dto.departureTime) <= new Date()) {
      throw new BadRequestException(
        'La date de départ doit être dans le futur.',
      );
    }

    // Vérifie la cohérence des places avec le véhicule
if (dto.availableSeats !== undefined && dto.availableSeats >= vehicle.seats) {
  throw new BadRequestException(
    `Le véhicule a ${vehicle.seats} places. Le conducteur en occupe une — max ${vehicle.seats - 1} places disponibles.`,
  );
}

    const { stops, ...tripData } = dto;

    const trip = this.tripRepo.create({
      ...tripData,
      driverId,
      departureTime: new Date(dto.departureTime),
      estimatedArrivalTime: dto.estimatedArrivalTime
        ? new Date(dto.estimatedArrivalTime)
        : undefined,
    });

    if (stops?.length) {
      trip.stops = stops.map((s) =>
        this.stopRepo.create({
          ...s,
          estimatedTime: s.estimatedTime ? new Date(s.estimatedTime) : undefined,
        }),
      );
    }

    const saved = await this.tripRepo.save(trip);
    this.logger.log(`Trajet créé : ${saved.id} par ${driverId}`);
    return this.toDto(saved);
  }

  // ─── READ ─────────────────────────────────────────────────────────────────

  async search(dto: SearchTripDto): Promise<PaginatedTrips> {
    const { departureCity, arrivalCity, date, seats, maxPrice, status, page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    const qb = this.tripRepo
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.driver', 'driver')
      .leftJoinAndSelect('trip.vehicle', 'vehicle')
      .leftJoinAndSelect('trip.stops', 'stops')
      .where('trip.status IN (:...statuses)', {
        statuses: status
          ? [status]
          : [TripStatus.PUBLISHED, TripStatus.FULL],
      });

    if (departureCity) {
      qb.andWhere('trip.departureCity ILIKE :dep', {
        dep: `%${departureCity}%`,
      });
    }

    if (arrivalCity) {
      qb.andWhere('trip.arrivalCity ILIKE :arr', {
        arr: `%${arrivalCity}%`,
      });
    }

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('trip.departureTime BETWEEN :start AND :end', { start, end });
    }

    if (seats) {
      qb.andWhere('trip.availableSeats >= :seats', { seats });
    }

    if (maxPrice) {
      qb.andWhere('trip.pricePerSeat <= :maxPrice', { maxPrice });
    }

    qb.orderBy('trip.departureTime', 'ASC')
      .skip(skip)
      .take(limit);

    const [trips, total] = await qb.getManyAndCount();

    return {
      data: trips.map((t) => this.toDto(t)),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<TripResponseDto> {
    const trip = await this.findOneOrFail(id);
    return this.toDto(trip);
  }

  async findByDriver(driverId: string): Promise<TripResponseDto[]> {
    const trips = await this.tripRepo.find({
      where: { driverId },
      order: { departureTime: 'DESC' },
    });
    return trips.map((t) => this.toDto(t));
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateTripDto,
    requesterId: string,
  ): Promise<TripResponseDto> {
    const trip = await this.findOneOrFail(id);
    this.assertDriver(trip, requesterId);

    if (
      trip.status === TripStatus.IN_PROGRESS ||
      trip.status === TripStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Impossible de modifier un trajet en cours ou terminé.',
      );
    }

    if (dto.departureTime) {
      if (new Date(dto.departureTime) <= new Date()) {
        throw new BadRequestException(
          'La date de départ doit être dans le futur.',
        );
      }
      trip.departureTime = new Date(dto.departureTime);
    }

    if (dto.estimatedArrivalTime) {
      trip.estimatedArrivalTime = new Date(dto.estimatedArrivalTime);
    }

    // Mise à jour des arrêts si fournis
    if (dto.stops) {
      await this.stopRepo.delete({ tripId: id });
      trip.stops = dto.stops.map((s) =>
        this.stopRepo.create({
          ...s,
          tripId: id,
          estimatedTime: s.estimatedTime ? new Date(s.estimatedTime) : undefined,
        }),
      );
    }

    const { stops, departureTime, estimatedArrivalTime, ...rest } = dto;
    Object.assign(trip, rest);

    const saved = await this.tripRepo.save(trip);
    return this.toDto(saved);
  }

  async cancel(id: string, requesterId: string): Promise<TripResponseDto> {
    const trip = await this.findOneOrFail(id);
    this.assertDriver(trip, requesterId);

    if (trip.status === TripStatus.COMPLETED) {
      throw new BadRequestException('Impossible d\'annuler un trajet terminé.');
    }

    trip.status = TripStatus.CANCELLED;
    const saved = await this.tripRepo.save(trip);
    this.logger.log(`Trajet annulé : ${id}`);
    return this.toDto(saved);
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────

  async remove(id: string, requesterId: string): Promise<void> {
    const trip = await this.findOneOrFail(id);
    this.assertDriver(trip, requesterId);

    if (trip.status !== TripStatus.DRAFT) {
      throw new BadRequestException(
        'Seuls les trajets en brouillon peuvent être supprimés. Utilisez l\'annulation.',
      );
    }

    await this.tripRepo.remove(trip);
    this.logger.log(`Trajet supprimé : ${id}`);
  }

  // ─── MÉTHODE PUBLIQUE utilisée par BookingsService ────────────────────────

  async findOneOrFail(id: string): Promise<Trip> {
    const trip = await this.tripRepo.findOne({
      where: { id },
      relations: ['stops'],
    });
    if (!trip) throw new NotFoundException(`Trajet ${id} introuvable.`);
    return trip;
  }

  async decrementSeats(tripId: string, count: number): Promise<void> {
    await this.tripRepo.decrement({ id: tripId }, 'availableSeats', count);
    const trip = await this.tripRepo.findOne({ where: { id: tripId } });
    if (trip && trip.availableSeats <= 0) {
      await this.tripRepo.update(tripId, { status: TripStatus.FULL });
    }
  }

  async incrementSeats(tripId: string, count: number): Promise<void> {
    await this.tripRepo.increment({ id: tripId }, 'availableSeats', count);
    await this.tripRepo.update(tripId, { status: TripStatus.PUBLISHED });
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  private assertDriver(trip: Trip, requesterId: string): void {
    if (trip.driverId !== requesterId) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres trajets.',
      );
    }
  }

  private toDto(trip: Trip): TripResponseDto {
    return plainToInstance(TripResponseDto, trip, {
      excludeExtraneousValues: true,
    });
  }
}