import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR...' })
  accessToken!: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR...' })
  refreshToken!: string;

  @ApiProperty({ example: 900 })
  expiresIn!: number;

  @ApiProperty()
  user!: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isVerified: boolean;
  };
}

export class RefreshTokenDto {
  @ApiProperty()
  refreshToken!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword123!' })
  currentPassword!: string;

  @ApiProperty({ example: 'NewPassword456!' })
  newPassword!: string;
}