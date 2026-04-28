import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional, IsString, IsDateString,
  IsInt, Min, Max, IsNumber, IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TripStatus } from '../entities/trips.entity';

export class SearchTripDto {
  @ApiPropertyOptional({ example: 'Dakar' })
  @IsOptional()
  @IsString()
  departureCity?: string;

  @ApiPropertyOptional({ example: 'Thiès' })
  @IsOptional()
  @IsString()
  arrivalCity?: string;

  @ApiPropertyOptional({ example: '2026-05-01' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  seats?: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({ enum: TripStatus })
  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}