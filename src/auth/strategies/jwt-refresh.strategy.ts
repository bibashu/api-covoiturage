import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    config: ConfigService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    const secret = config.get<string>('JWT_REFRESH_SECRET');

    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is missing');
    }

    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string }) {
    const refreshToken = req.body?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token manquant');
    }

    const user = await this.userRepo.findOne({
      where: { id: payload.sub, isActive: true },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);

    if (!isValid) {
      throw new UnauthorizedException('Refresh token expiré');
    }

    return user;
  }
}