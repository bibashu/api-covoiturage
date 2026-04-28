import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { UserResponseDto } from '../../users/dto/user-response.dto';

@Exclude()
export class VehicleResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  brand!: string;

  @Expose()
  @ApiProperty()
  model!: string;

  @Expose()
  @ApiProperty()
  year!: number;

  @Expose()
  @ApiProperty()
  color!: string;

  @Expose()
  @ApiProperty()
  licensePlate!: string;

  @Expose()
  @ApiProperty()
  seats!: number;

  @Expose()
  @ApiProperty({ nullable: true })
  photoUrl!: string;

  @Expose()
  @ApiProperty()
  isActive!: boolean;

  @Expose()
  @ApiProperty({ type: () => UserResponseDto })
  @Type(() => UserResponseDto)
  owner!: UserResponseDto;

  @Expose()
  @ApiProperty()
  createdAt!: Date;

  @Expose()
  @ApiProperty()
  updatedAt!: Date;
}