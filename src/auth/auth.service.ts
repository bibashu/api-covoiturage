import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';

import { LoginDto } from './dto/login.dto';

import { RegisterDto } from './dto/auth.dto';
import { AuthResponseDto, ChangePasswordDto } from './dto/response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ================= REGISTER =================
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const exists = await this.userRepo.findOne({
      where: { email: dto.email },
    });

    if (exists) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const user = this.userRepo.create(dto);
    await this.userRepo.save(user);

    return this.generateTokens(user);
  }

  // ================= LOGIN =================
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepo.findOne({
      where: { email: dto.email, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const isValid = await user.validatePassword(dto.password);

    if (!isValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    return this.generateTokens(user);
  }

  // ================= REFRESH =================
  async refresh(user: User): Promise<AuthResponseDto> {
    return this.generateTokens(user);
  }

  // ================= LOGOUT =================
  async logout(userId: string): Promise<void> {
    await this.userRepo.update(userId, {
      // refreshToken: null,
    });
  }

  // ================= CHANGE PASSWORD =================
  async changePassword(
    user: User,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const isValid = await user.validatePassword(dto.currentPassword);

    if (!isValid) {
      throw new BadRequestException('Mot de passe actuel incorrect');
    }

    user.password = dto.newPassword;

    await this.userRepo.save(user);

    await this.userRepo.update(user.id, {
    //   refreshToken: null,
    });

    return { message: 'Mot de passe modifié avec succès' };
  }

  // ================= PROFILE =================
  async getProfile(userId: string): Promise<User> {
    return this.userRepo.findOneOrFail({
      where: { id: userId },
    });
  }

  // ================= GENERATE TOKENS =================
  private async generateTokens(user: User): Promise<AuthResponseDto> {
    const jwtSecret = this.config.get<string>('JWT_SECRET');
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET');

    if (!jwtSecret || !refreshSecret) {
      throw new Error('JWT secrets manquants');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    const hashedRefresh = await bcrypt.hash(refreshToken, 10);

    await this.userRepo.update(user.id, {
      refreshToken: hashedRefresh,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    };
  }
}