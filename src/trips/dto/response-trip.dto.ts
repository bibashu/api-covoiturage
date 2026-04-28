import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { TripStatus } from '../entities/trips.entity';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { VehicleResponseDto } from '../../vehicles/dto/vehicule-response.dto';


export class TripStopResponseDto {
  @Expose() id!: string;
  @Expose() city!: string;
  @Expose() address!: string;
  @Expose() latitude!: number;
  @Expose() longitude!: number;
  @Expose() order!: number;
  @Expose() estimatedTime!: Date;
  @Expose() priceFromDeparture!: number;
}

@Exclude()
export class TripResponseDto {
  @Expose() @ApiProperty() id!: string;
  @Expose() @ApiProperty() departureCity!: string;
  @Expose() @ApiProperty() arrivalCity!: string;
  @Expose() @ApiProperty() departureAddress!: string;
  @Expose() @ApiProperty() arrivalAddress!: string;
  @Expose() @ApiProperty() departureLat!: number;
  @Expose() @ApiProperty() departureLon!: number;
  @Expose() @ApiProperty() arrivalLat!: number;
  @Expose() @ApiProperty() arrivalLon!: number;
  @Expose() @ApiProperty() departureTime!: Date;
  @Expose() @ApiProperty() estimatedArrivalTime!: Date;
  @Expose() @ApiProperty() availableSeats!: number;
  @Expose() @ApiProperty() pricePerSeat!: number;
  @Expose() @ApiProperty({ enum: TripStatus }) status!: TripStatus;
  @Expose() @ApiProperty() smokingAllowed!: boolean;
  @Expose() @ApiProperty() petsAllowed!: boolean;
  @Expose() @ApiProperty() musicAllowed!: boolean;
  @Expose() @ApiProperty() description!: string;

  @Expose()
  @ApiProperty({ type: () => UserResponseDto })
  @Type(() => UserResponseDto)
  driver!: UserResponseDto;

  @Expose()
  @ApiProperty({ type: () => VehicleResponseDto })
  @Type(() => VehicleResponseDto)
  vehicle!: VehicleResponseDto;

  @Expose()
  @ApiProperty({ type: [TripStopResponseDto] })
  @Type(() => TripStopResponseDto)
  stops!: TripStopResponseDto[];

  @Expose() @ApiProperty() createdAt!: Date;
  @Expose() @ApiProperty() updatedAt!: Date;
}