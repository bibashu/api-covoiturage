import {
  Injectable, BadRequestException, NotFoundException,
  ForbiddenException, Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '../users/entities/user.entity';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import {
  SendOtpDto, VerifyOtpDto,
  CompleteProfileDto, AuthResponseDto,
} from './dto/auth.dto';

const OTP_TTL_MIN   = 10;   // minutes avant expiration du code
const OTP_MAX_TRIES = 5;    // tentatives avant blocage
const OTP_BLOCK_MIN = 30;   // minutes de blocage après trop d'échecs

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly whatsappService: WhatsAppService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 1 — L'utilisateur entre son numéro → OTP envoyé sur WhatsApp
  // ═══════════════════════════════════════════════════════════════════════════

  async sendOtp(dto: SendOtpDto): Promise<{ message: string }> {
    // Trouver ou créer l'utilisateur
    let user = await this.userRepo.findOne({ where: { phone: dto.phone } });

    if (!user) {
      user = this.userRepo.create({ phone: dto.phone, status: UserStatus.PENDING });
      await this.userRepo.save(user);
      this.logger.log(`Nouvel utilisateur créé : ${dto.phone}`);
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Ce compte a été suspendu.');
    }

    // Anti-spam : 60 secondes minimum entre deux envois
    if (user.otpExpiresAt) {
      const sentAt      = new Date(user.otpExpiresAt.getTime() - OTP_TTL_MIN * 60_000);
      const secondsPast = (Date.now() - sentAt.getTime()) / 1000;
      if (secondsPast < 60) {
        const wait = Math.ceil(60 - secondsPast);
        throw new BadRequestException(`Attendez ${wait} seconde(s) avant de renvoyer.`);
      }
    }

    await this.generateAndSendOtp(user);

    return {
      message: `Un code à 6 chiffres a été envoyé au ${dto.phone} via WhatsApp.`,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 2 — L'utilisateur saisit le code OTP
  // ═══════════════════════════════════════════════════════════════════════════

  async verifyOtp(dto: VerifyOtpDto): Promise<AuthResponseDto> {
    const user = await this.userRepo.findOne({ where: { phone: dto.phone } });
    if (!user) throw new NotFoundException('Numéro introuvable.');

    // Compte bloqué ?
    if (user.otpBlockedUntil && user.otpBlockedUntil > new Date()) {
      const min = Math.ceil((user.otpBlockedUntil.getTime() - Date.now()) / 60_000);
      throw new BadRequestException(
        `Trop de tentatives. Réessayez dans ${min} minute(s).`,
      );
    }

    // Code absent ou expiré ?
    if (!user.otpCode || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw new BadRequestException('Code expiré. Demandez un nouveau code.');
    }

    // Code incorrect ?
    const isValid = await bcrypt.compare(dto.code, user.otpCode);
    if (!isValid) {
      user.otpAttempts += 1;

      if (user.otpAttempts >= OTP_MAX_TRIES) {
        user.otpBlockedUntil = new Date(Date.now() + OTP_BLOCK_MIN * 60_000);
        user.otpAttempts     = 0;
        await this.userRepo.save(user);
        throw new BadRequestException(
          `Code incorrect. Compte bloqué ${OTP_BLOCK_MIN} minutes.`,
        );
      }

      const remaining = OTP_MAX_TRIES - user.otpAttempts;
      await this.userRepo.save(user);
      throw new BadRequestException(
        `Code incorrect. ${remaining} tentative(s) restante(s).`,
      );
    }

    // ✅ Code valide — nettoyer les champs OTP
    user.otpCode         = null as unknown as string;
    user.otpExpiresAt    = null as unknown as Date;
    user.otpAttempts     = 0;
    user.otpBlockedUntil = null as unknown as Date;
    await this.userRepo.save(user);

    this.logger.log(`OTP vérifié : ${dto.phone}`);

    // Retourner les tokens JWT
    // Si isProfileComplete = false → le mobile redirige vers l'écran 3
    return this.buildTokens(user);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 3 — L'utilisateur renseigne son nom et prénom
  // ═══════════════════════════════════════════════════════════════════════════

  async completeProfile(
    userId: string,
    dto: CompleteProfileDto,
  ): Promise<AuthResponseDto> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    if (user.status === UserStatus.ACTIVE && user.firstName) {
      throw new BadRequestException('Profil déjà complété.');
    }

    user.firstName = dto.firstName.trim();
    user.lastName  = dto.lastName.trim();
    user.role      = dto.role ?? user.role;
    user.status    = UserStatus.ACTIVE;

    await this.userRepo.save(user);
    this.logger.log(`Profil complété : ${user.phone} → ${user.fullName}`);

    // isProfileComplete = true → le mobile redirige vers l'espace principal
    return this.buildTokens(user);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REFRESH TOKEN
  // ═══════════════════════════════════════════════════════════════════════════

  async refresh(user: User): Promise<AuthResponseDto> {
    return this.buildTokens(user);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGOUT
  // ═══════════════════════════════════════════════════════════════════════════

  async logout(userId: string): Promise<void> {
    await this.userRepo.update(userId, {
      refreshToken: null as unknown as string,
    });
    this.logger.log(`Déconnexion : ${userId}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS PRIVÉS
  // ═══════════════════════════════════════════════════════════════════════════

  private generateCode(): string {
    return Math.floor(100_000 + Math.random() * 900_000).toString();
  }

  private async generateAndSendOtp(user: User): Promise<void> {
    const code    = this.generateCode();
    const hashed  = await bcrypt.hash(code, 10);
    const expires = new Date(Date.now() + OTP_TTL_MIN * 60_000);

    await this.userRepo.update(user.id, {
      otpCode:         hashed,
      otpExpiresAt:    expires,
      otpAttempts:     0,
      otpBlockedUntil: null as unknown as Date,
    });

    // Envoi WhatsApp
    await this.whatsappService.sendOtp(user.phone, code);
  }

  async buildTokens(user: User): Promise<AuthResponseDto> {
    const payload = {
      sub:    user.id,
      phone:  user.phone,
      role:   user.role,
      status: user.status,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret:    this.config.get('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret:    this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    await this.userRepo.update(user.id, {
      refreshToken: await bcrypt.hash(refreshToken, 10),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: {
        id:                user.id,
        phone:             user.phone,
        firstName:         user.firstName,
        lastName:          user.lastName,
        role:              user.role,
        status:            user.status,
        isProfileComplete: user.isProfileComplete,
      },
    };
  }
}
