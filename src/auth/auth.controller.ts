import {
  Controller, Post, Get, Body,
  UseGuards, HttpCode, HttpStatus, Patch,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';

import { LoginDto } from './dto/login.dto';

import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { ApiAuthRequired } from './decorators/api-auth.decorator';
import { User } from '../users/entities/user.entity';
import { AuthResponseDto, ChangePasswordDto, RefreshTokenDto } from './dto/response.dto';
import { RegisterDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Créer un nouveau compte' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Se connecter' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Identifiants incorrects' })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renouveler le access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  refresh(@CurrentUser() user: User): Promise<AuthResponseDto> {
    return this.authService.refresh(user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiAuthRequired()
  @ApiOperation({ summary: 'Se déconnecter (invalide le refresh token)' })
  @ApiResponse({ status: 204 })
  logout(@CurrentUser() user: User): Promise<void> {
    return this.authService.logout(user.id);
  }

  @Get('me')
  @ApiAuthRequired()
  @ApiOperation({ summary: 'Profil de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, type: User })
  getProfile(@CurrentUser() user: User): Promise<User> {
    return this.authService.getProfile(user.id);
  }

  @Patch('change-password')
  @ApiAuthRequired()
  @ApiOperation({ summary: 'Changer le mot de passe' })
  @ApiResponse({ status: 200, description: 'Mot de passe modifié' })
  changePassword(
    @CurrentUser() user: User,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user, dto);
  }
}