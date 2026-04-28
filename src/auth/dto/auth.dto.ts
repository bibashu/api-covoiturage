import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail, IsString, MinLength, MaxLength,
  IsOptional, IsEnum,
} from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @ApiProperty({ example: 'Moussa' })
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'Diallo' })
  @IsString()
  @MaxLength(100)
  lastName!: string;

  @ApiProperty({ example: 'moussa@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password!: string;

  @ApiProperty({ example: '+221770000000', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.BOTH, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}