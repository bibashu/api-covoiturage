import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsInt, Min, Max, IsOptional, IsString } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'uuid-du-trajet' })
  @IsUUID()
  tripId!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(8)
  seatsBooked!: number;

  @ApiPropertyOptional({ example: 'Je serai à l\'arrêt principal.' })
  @IsOptional()
  @IsString()
  passengerNote?: string;
}