import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, Length, IsEnum,
  IsOptional, MaxLength,
} from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

// ─── Étape 1 — saisie numéro ──────────────────────────────────────────────────
export class SendOtpDto {
  @ApiProperty({ example: '+221770000000', description: 'Numéro avec indicatif pays' })
  @IsString()
  @Length(8, 20)
  phone: string;
}

// ─── Étape 2 — saisie code OTP ────────────────────────────────────────────────
export class VerifyOtpDto {
  @ApiProperty({ example: '+221770000000' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '482931', description: 'Code à 6 chiffres reçu sur WhatsApp' })
  @IsString()
  @Length(6, 6)
  code: string;
}

// ─── Étape 3 — complétion profil ──────────────────────────────────────────────
export class CompleteProfileDto {
  @ApiProperty({ example: 'Moussa' })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Diallo' })
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.BOTH })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

// ─── Réponse JWT (étapes 2 et 3) ──────────────────────────────────────────────
export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty({ example: 900 })
  expiresIn: number;

  @ApiProperty()
  user: {
    id:                string;
    phone:             string;
    firstName:         string | null;
    lastName:          string | null;
    role:              string;
    status:            string;
    isProfileComplete: boolean;
  };
}

export class RefreshTokenDto {
  @ApiProperty()
  refreshToken: string;
}
