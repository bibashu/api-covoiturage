import {
  Controller, Post, Patch, Get,
  Body, HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  SendOtpDto, VerifyOtpDto,
  CompleteProfileDto, AuthResponseDto, RefreshTokenDto,
} from './dto/auth.dto';
import {
  Public, SkipProfileCheck, ApiAuthRequired,
} from './decorators/auth.decorators';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── Étape 1 ─────────────────────────────────────────────────────────────
  @Public()
  @Post('send-otp')
  @ApiOperation({ summary: 'Étape 1 — Saisir le numéro → reçoit OTP WhatsApp' })
  @ApiResponse({
    status: 201,
    schema: { properties: { message: { type: 'string' } } },
  })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  // ─── Étape 2 ─────────────────────────────────────────────────────────────
  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Étape 2 — Vérifier le code OTP' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Code invalide, expiré ou compte bloqué' })
  verifyOtp(@Body() dto: VerifyOtpDto): Promise<AuthResponseDto> {
    return this.authService.verifyOtp(dto);
  }

  // ─── Étape 3 ─────────────────────────────────────────────────────────────
  @SkipProfileCheck()
  @ApiAuthRequired()
  @Patch('complete-profile')
  @ApiOperation({
    summary: 'Étape 3 — Renseigner prénom + nom (token étape 2 requis)',
  })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  completeProfile(
    @Body() dto: CompleteProfileDto,
    @CurrentUser() user: User,
  ): Promise<AuthResponseDto> {
    return this.authService.completeProfile(user.id, dto);
  }

  // ─── Renvoyer OTP ─────────────────────────────────────────────────────────
  @Public()
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renvoyer l\'OTP (min 60s entre deux envois)' })
  resendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  // ─── Refresh token ────────────────────────────────────────────────────────
  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renouveler le access token' })
  refresh(@CurrentUser() user: User): Promise<AuthResponseDto> {
    return this.authService.refresh(user);
  }

  // ─── Logout ───────────────────────────────────────────────────────────────
  @ApiAuthRequired()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@CurrentUser() user: User) {
    return this.authService.logout(user.id);
  }

  // ─── Me ───────────────────────────────────────────────────────────────────
  @SkipProfileCheck()
  @ApiAuthRequired()
  @Get('me')
  @ApiOperation({ summary: 'Profil de l\'utilisateur connecté' })
  getMe(@CurrentUser() user: User) {
    return user;
  }
}
