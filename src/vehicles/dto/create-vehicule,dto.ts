import { ApiProperty } from '@nestjs/swagger';
import {
  IsString, IsInt, Min, Max,
  MaxLength, Matches,
} from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: 'Toyota' })
  @IsString()
  @MaxLength(100)
  brand!: string;

  @ApiProperty({ example: 'Corolla' })
  @IsString()
  @MaxLength(100)
  model!: string;

  @ApiProperty({ example: 2020 })
  @IsInt()
  @Min(1990)
  @Max(new Date().getFullYear() + 1)
  year!: number;

  @ApiProperty({ example: 'Blanc' })
  @IsString()
  @MaxLength(50)
  color!: string;

  @ApiProperty({ example: 'DK-1234-AB' })
  @IsString()
  @MaxLength(20)
  licensePlate!: string;

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  @Max(9)
  seats!: number;
}