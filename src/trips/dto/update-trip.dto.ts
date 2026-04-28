import { PartialType, OmitType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateTripDto } from './create-trip.dto';
import { TripStatus } from '../entities/trips.entity';

export class UpdateTripDto extends PartialType(
  OmitType(CreateTripDto, ['vehicleId'] as const),
) {
  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;
}