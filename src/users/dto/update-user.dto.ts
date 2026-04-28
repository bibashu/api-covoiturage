import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MaxLength,
  IsEnum,
  MinLength,
  IsEmail,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Moussa' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Diallo' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: '+221770000000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class UpdateEmailDto {
  @ApiPropertyOptional({ example: 'nouveau@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'MonMotDePasse123!' })
  @IsString()
  @MinLength(8)
  currentPassword: string;
}

export class UpdatePasswordDto {
  @ApiPropertyOptional({ example: 'AncienMotDePasse123!' })
  @IsString()
  @MinLength(8)
  currentPassword: string;

  @ApiPropertyOptional({ example: 'NouveauMotDePasse456!' })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  newPassword: string;
}
