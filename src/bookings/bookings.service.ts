import {
  Injectable, NotFoundException, BadRequestException,
  ForbiddenException, ConflictException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Booking, BookingStatus } from './entities/bookings.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { TripsService } from '../trips/trips.service';
import { TripStatus } from '../trips/entities/trips.entity';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    private readonly tripsService: TripsService,
  ) {}

  // ─── CREATE ───────────────────────────────────────────────────────────────

  async create(
    dto: CreateBookingDto,
    passengerId: string,
  ): Promise<BookingResponseDto> {
    const trip = await this.tripsService.findOneOrFail(dto.tripId);

    // Le conducteur ne peut pas réserver son propre trajet
    if (trip.driverId === passengerId) {
      throw new BadRequestException(
        'Vous ne pouvez pas réserver votre propre trajet.',
      );
    }

    // Vérifier que le trajet est disponible
    if (![TripStatus.PUBLISHED, TripStatus.FULL].includes(trip.status)) {
      throw new BadRequestException(
        `Ce trajet n'est plus disponible (statut : ${trip.status}).`,
      );
    }

    // Vérifier les places disponibles
    if (trip.availableSeats < dto.seatsBooked) {
      throw new BadRequestException(
        `Seulement ${trip.availableSeats} place(s) disponible(s).`,
      );
    }

    // Vérifier qu'une réservation active n'existe pas déjà
    const existing = await this.bookingRepo.findOne({
      where: {
        tripId: dto.tripId,
        passengerId,
        status: BookingStatus.PENDING,
      },
    });
    if (existing) {
      throw new ConflictException(
        'Vous avez déjà une réservation en attente pour ce trajet.',
      );
    }

    const totalAmount = Number(trip.pricePerSeat) * dto.seatsBooked;

    const booking = this.bookingRepo.create({
      ...dto,
      passengerId,
      totalAmount,
      status: BookingStatus.PENDING,
    });

    const saved = await this.bookingRepo.save(booking);
    this.logger.log(`Réservation créée : ${saved.id} par ${passengerId}`);
    return this.toDto(saved);
  }

  // ─── READ ─────────────────────────────────────────────────────────────────

  async findOne(id: string, requesterId: string): Promise<BookingResponseDto> {
    const booking = await this.findOneOrFail(id);
    this.assertParticipant(booking, requesterId);
    return this.toDto(booking);
  }

  async findMyBookings(passengerId: string): Promise<BookingResponseDto[]> {
    const bookings = await this.bookingRepo.find({
      where: { passengerId },
      relations: ['trip', 'trip.driver', 'trip.vehicle'],
      order: { createdAt: 'DESC' },
    });
    return bookings.map((b) => this.toDto(b));
  }

  async findTripBookings(
    tripId: string,
    driverId: string,
  ): Promise<BookingResponseDto[]> {
    const trip = await this.tripsService.findOneOrFail(tripId);
    if (trip.driverId !== driverId) {
      throw new ForbiddenException('Accès refusé.');
    }
    const bookings = await this.bookingRepo.find({
      where: { tripId },
      relations: ['passenger'],
      order: { createdAt: 'ASC' },
    });
    return bookings.map((b) => this.toDto(b));
  }

  // ─── ACTIONS CONDUCTEUR ───────────────────────────────────────────────────

  async confirm(id: string, driverId: string): Promise<BookingResponseDto> {
    const booking = await this.findOneOrFail(id);
    const trip = await this.tripsService.findOneOrFail(booking.tripId);

    if (trip.driverId !== driverId) {
      throw new ForbiddenException(
        'Seul le conducteur peut confirmer une réservation.',
      );
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(
        `Impossible de confirmer une réservation en statut "${booking.status}".`,
      );
    }

    if (trip.availableSeats < booking.seatsBooked) {
      throw new BadRequestException(
        'Plus assez de places disponibles pour confirmer.',
      );
    }

    booking.status = BookingStatus.CONFIRMED;
    booking.confirmedAt = new Date();
    const saved = await this.bookingRepo.save(booking);

    // Décrémenter les places disponibles sur le trajet
    await this.tripsService.decrementSeats(booking.tripId, booking.seatsBooked);

    this.logger.log(`Réservation confirmée : ${id} par conducteur ${driverId}`);
    return this.toDto(saved);
  }

  async reject(id: string, driverId: string, reason?: string): Promise<BookingResponseDto> {
    const booking = await this.findOneOrFail(id);
    const trip = await this.tripsService.findOneOrFail(booking.tripId);

    if (trip.driverId !== driverId) {
      throw new ForbiddenException(
        'Seul le conducteur peut refuser une réservation.',
      );
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(
        `Impossible de refuser une réservation en statut "${booking.status}".`,
      );
    }

    booking.status = BookingStatus.REJECTED;
    booking.cancellationReason = reason ?? 'Refusée par le conducteur.';
    booking.cancelledAt = new Date();
    const saved = await this.bookingRepo.save(booking);

    this.logger.log(`Réservation refusée : ${id}`);
    return this.toDto(saved);
  }

  // ─── ANNULATION PASSAGER ──────────────────────────────────────────────────

  async cancelByPassenger(
    id: string,
    passengerId: string,
    dto: CancelBookingDto,
  ): Promise<BookingResponseDto> {
    const booking = await this.findOneOrFail(id);

    if (booking.passengerId !== passengerId) {
      throw new ForbiddenException(
        'Vous ne pouvez annuler que vos propres réservations.',
      );
    }

    const cancellableStatuses = [
      BookingStatus.PENDING,
      BookingStatus.CONFIRMED,
    ];
    if (!cancellableStatuses.includes(booking.status)) {
      throw new BadRequestException(
        `Impossible d'annuler une réservation en statut "${booking.status}".`,
      );
    }

    const wasConfirmed = booking.status === BookingStatus.CONFIRMED;

    booking.status = BookingStatus.CANCELLED_BY_PASSENGER;
    booking.cancellationReason = dto.reason ?? 'Annulée par le passager.';
    booking.cancelledAt = new Date();
    const saved = await this.bookingRepo.save(booking);

    // Libérer les places uniquement si la réservation était confirmée
    if (wasConfirmed) {
      await this.tripsService.incrementSeats(booking.tripId, booking.seatsBooked);
    }

    this.logger.log(`Réservation annulée par passager : ${id}`);
    return this.toDto(saved);
  }

  // ─── ANNULATION CONDUCTEUR ────────────────────────────────────────────────

  async cancelByDriver(
    id: string,
    driverId: string,
    dto: CancelBookingDto,
  ): Promise<BookingResponseDto> {
    const booking = await this.findOneOrFail(id);
    const trip = await this.tripsService.findOneOrFail(booking.tripId);

    if (trip.driverId !== driverId) {
      throw new ForbiddenException(
        'Seul le conducteur peut annuler cette réservation.',
      );
    }

    const cancellableStatuses = [
      BookingStatus.PENDING,
      BookingStatus.CONFIRMED,
    ];
    if (!cancellableStatuses.includes(booking.status)) {
      throw new BadRequestException(
        `Impossible d'annuler une réservation en statut "${booking.status}".`,
      );
    }

    const wasConfirmed = booking.status === BookingStatus.CONFIRMED;

    booking.status = BookingStatus.CANCELLED_BY_DRIVER;
    booking.cancellationReason = dto.reason ?? 'Annulée par le conducteur.';
    booking.cancelledAt = new Date();
    const saved = await this.bookingRepo.save(booking);

    if (wasConfirmed) {
      await this.tripsService.incrementSeats(booking.tripId, booking.seatsBooked);
    }

    this.logger.log(`Réservation annulée par conducteur : ${id}`);
    return this.toDto(saved);
  }

  // ─── COMPLÉTION (appelée par un job planifié ou manuellement) ─────────────

  async complete(id: string): Promise<BookingResponseDto> {
    const booking = await this.findOneOrFail(id);

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        'Seules les réservations confirmées peuvent être marquées comme terminées.',
      );
    }

    booking.status = BookingStatus.COMPLETED;
    const saved = await this.bookingRepo.save(booking);
    return this.toDto(saved);
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  async findOneOrFail(id: string): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: ['passenger', 'trip', 'trip.driver', 'trip.vehicle'],
    });
    if (!booking) {
      throw new NotFoundException(`Réservation ${id} introuvable.`);
    }
    return booking;
  }

  private assertParticipant(booking: Booking, requesterId: string): void {
    const isPassenger = booking.passengerId === requesterId;
    const isDriver = booking.trip?.driverId === requesterId;
    if (!isPassenger && !isDriver) {
      throw new ForbiddenException('Accès refusé.');
    }
  }

  private toDto(booking: Booking): BookingResponseDto {
    return plainToInstance(BookingResponseDto, booking, {
      excludeExtraneousValues: true,
    });
  }
}