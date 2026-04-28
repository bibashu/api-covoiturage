import {
  Controller, Get, Post, Patch,
  Body, Param, ParseUUIDPipe,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiParam,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiAuthRequired } from '../auth/decorators/api-auth.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('bookings')
@ApiAuthRequired()
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // ─── PASSAGER ─────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Demander une réservation sur un trajet' })
  @ApiResponse({ status: 201, type: BookingResponseDto })
  @ApiResponse({ status: 400, description: 'Places insuffisantes ou trajet indisponible' })
  @ApiResponse({ status: 409, description: 'Réservation déjà en attente' })
  create(
    @Body() dto: CreateBookingDto,
    @CurrentUser() user: User,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.create(dto, user.id);
  }

  @Get('my')
  @ApiOperation({ summary: 'Mes réservations (passager)' })
  @ApiResponse({ status: 200, type: [BookingResponseDto] })
  findMy(@CurrentUser() user: User): Promise<BookingResponseDto[]> {
    return this.bookingsService.findMyBookings(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une réservation (passager ou conducteur)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.findOne(id, user.id);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Annuler une réservation (passager)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  cancelByPassenger(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelBookingDto,
    @CurrentUser() user: User,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.cancelByPassenger(id, user.id, dto);
  }

  // ─── CONDUCTEUR ───────────────────────────────────────────────────────────

  @Get('trip/:tripId')
  @ApiOperation({ summary: 'Réservations d\'un trajet (conducteur)' })
  @ApiParam({ name: 'tripId', type: String })
  @ApiResponse({ status: 200, type: [BookingResponseDto] })
  findTripBookings(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @CurrentUser() user: User,
  ): Promise<BookingResponseDto[]> {
    return this.bookingsService.findTripBookings(tripId, user.id);
  }

  @Patch(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmer une réservation (conducteur)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  @ApiResponse({ status: 400, description: 'Statut invalide ou plus de places' })
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.confirm(id, user.id);
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refuser une réservation (conducteur)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelBookingDto,
    @CurrentUser() user: User,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.reject(id, user.id, dto.reason);
  }

  @Patch(':id/cancel-driver')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Annuler une réservation confirmée (conducteur)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  cancelByDriver(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelBookingDto,
    @CurrentUser() user: User,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.cancelByDriver(id, user.id, dto);
  }
}