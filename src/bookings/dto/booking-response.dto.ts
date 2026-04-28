import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { BookingStatus } from '../entities/bookings.entity';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { TripResponseDto } from '../../trips/dto/response-trip.dto';


@Exclude()
export class BookingResponseDto {
  @Expose() @ApiProperty() id!: string;
  @Expose() @ApiProperty() seatsBooked!: number;
  @Expose() @ApiProperty() totalAmount!: number;
  @Expose() @ApiProperty({ enum: BookingStatus }) status!: BookingStatus;
  @Expose() @ApiProperty() passengerNote!: string;
  @Expose() @ApiProperty() cancellationReason!: string;
  @Expose() @ApiProperty() confirmedAt!: Date;
  @Expose() @ApiProperty() cancelledAt!: Date;
  @Expose() @ApiProperty() createdAt!: Date;
  @Expose() @ApiProperty() updatedAt!: Date;

  @Expose()
  @ApiProperty({ type: () => UserResponseDto })
  @Type(() => UserResponseDto)
  passenger!: UserResponseDto;

  @Expose()
  @ApiProperty({ type: () => TripResponseDto })
  @Type(() => TripResponseDto)
  trip!: TripResponseDto;
}