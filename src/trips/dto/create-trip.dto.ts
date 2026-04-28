import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsNumber, IsDateString, IsBoolean,
  IsUUID, IsOptional, Min, IsInt, IsArray,
  ValidateNested, MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTripStopDto {
  @ApiProperty({ example: 'Mbour' })
  @IsString()
  @MaxLength(100)
  city!: string;

  @ApiPropertyOptional({ example: 'Gare routière de Mbour' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 14.3673 })
  @IsNumber()
  latitude!: number;

  @ApiProperty({ example: -16.9659 })
  @IsNumber()
  longitude!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  order!: number;

  @ApiPropertyOptional({ example: '2026-05-01T08:00:00Z' })
  @IsOptional()
  @IsDateString()
  estimatedTime?: string;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceFromDeparture?: number;
}

export class CreateTripDto {
  @ApiProperty({ example: 'uuid-vehicule' })
  @IsUUID()
  vehicleId!: string;

  @ApiProperty({ example: 'Dakar' })
  @IsString()
  @MaxLength(100)
  departureCity!: string;

  @ApiProperty({ example: 'Thiès' })
  @IsString()
  @MaxLength(100)
  arrivalCity!: string;

  @ApiPropertyOptional({ example: 'Plateau, Dakar' })
  @IsOptional()
  @IsString()
  departureAddress?: string;

  @ApiPropertyOptional({ example: 'Centre-ville, Thiès' })
  @IsOptional()
  @IsString()
  arrivalAddress?: string;

  @ApiProperty({ example: 14.6928 })
  @IsNumber()
  departureLat!: number;

  @ApiProperty({ example: -17.4467 })
  @IsNumber()
  departureLon!: number;

  @ApiProperty({ example: 14.7833 })
  @IsNumber()
  arrivalLat!: number;

  @ApiProperty({ example: -16.9167 })
  @IsNumber()
  arrivalLon!: number;

  @ApiProperty({ example: '2026-05-01T07:00:00Z' })
  @IsDateString()
  departureTime!: string;

  @ApiPropertyOptional({ example: '2026-05-01T09:00:00Z' })
  @IsOptional()
  @IsDateString()
  estimatedArrivalTime?: string;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  availableSeats?: number;

  @ApiProperty({ example: 2500 })
  @IsNumber()
  @Min(0)
  pricePerSeat!: number;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  smokingAllowed!: boolean;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  petsAllowed?: boolean;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  musicAllowed?: boolean;

  @ApiPropertyOptional({ example: 'Pas de bagages volumineux.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [CreateTripStopDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTripStopDto)
  stops?: CreateTripStopDto[];
}