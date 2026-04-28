import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

import { UserResponseDto } from '../../users/dto/user-response.dto';
import { ReviewTarget } from '../entities/reviews.entity';

@Exclude()
export class ReviewResponseDto {
  @Expose() @ApiProperty() id!: string;
  @Expose() @ApiProperty() bookingId!: string;
  @Expose() @ApiProperty({ enum: ReviewTarget }) targetType!: ReviewTarget;
  @Expose() @ApiProperty({ example: 5 }) rating!: number;
  @Expose() @ApiProperty() comment!: string;
  @Expose() @ApiProperty() isReported!: boolean;
  @Expose() @ApiProperty() createdAt!: Date;

  @Expose()
  @ApiProperty({ type: () => UserResponseDto })
  @Type(() => UserResponseDto)
  author!: UserResponseDto;

  @Expose()
  @ApiProperty({ type: () => UserResponseDto })
  @Type(() => UserResponseDto)
  target!: UserResponseDto;
}

export class UserRatingSummaryDto {
  @ApiProperty({ example: 4.8 }) averageRating!: number;
  @ApiProperty({ example: 24 }) totalRatings!: number;
  @ApiProperty({ type: [ReviewResponseDto] }) reviews!: ReviewResponseDto[];
}