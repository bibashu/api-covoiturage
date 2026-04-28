import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID, IsInt, Min, Max,
  IsOptional, IsString, MaxLength,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 'uuid-de-la-reservation' })
  @IsUUID()
  bookingId!: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({ example: 'Conducteur ponctuel, trajet agréable.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}