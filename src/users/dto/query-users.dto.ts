import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min, Max, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../entities/user.entity';

export class QueryUsersDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: 'moussa' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  isVerified?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;
}

export class PaginatedResponseDto<T> {
  data!: T[];
  total!: number;
  page!: number;
  limit!: number;
  lastPage!: number;
  hasNext!: boolean;
  hasPrev!: boolean;
}
