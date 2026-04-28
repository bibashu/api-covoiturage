import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { UserRole } from '../entities/user.entity';

@Exclude()
export class UserResponseDto {
  @Expose()
  @ApiProperty({ example: 'uuid-v4' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'Moussa' })
  firstName: string;

  @Expose()
  @ApiProperty({ example: 'Diallo' })
  lastName: string;

  @Expose()
  @ApiProperty({ example: 'Moussa Diallo' })
  @Transform(({ obj }) => `${obj.firstName} ${obj.lastName}`)
  fullName: string;

  @Expose()
  @ApiProperty({ example: 'moussa@example.com' })
  email: string;

  @Expose()
  @ApiProperty({ example: '+221770000000' })
  phone: string;

  @Expose()
  @ApiProperty({ example: 'https://res.cloudinary.com/...' })
  photoUrl: string;

  @Expose()
  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @Expose()
  @ApiProperty({ example: 4.8 })
  averageRating: number;

  @Expose()
  @ApiProperty({ example: 12 })
  totalRatings: number;

  @Expose()
  @ApiProperty({ example: false })
  isVerified: boolean;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;
}
