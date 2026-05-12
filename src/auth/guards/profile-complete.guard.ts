import {
  Injectable, CanActivate,
  ExecutionContext, ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserStatus } from '../../users/entities/user.entity';
import { SKIP_PROFILE_KEY } from '../decorators/auth.decorators';

/**
 * Bloque toutes les routes protégées si le profil n'est pas complet.
 * Bypassé par @SkipProfileCheck() sur /auth/complete-profile et /auth/me.
 */
@Injectable()
export class ProfileCompleteGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_PROFILE_KEY, [
      ctx.getHandler(), ctx.getClass(),
    ]);
    if (skip) return true;

    const { user } = ctx.switchToHttp().getRequest();
    if (!user) return true; // JwtAuthGuard gère l'absence

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException(
        'Veuillez compléter votre profil (nom et prénom) pour accéder à cette fonctionnalité.',
      );
    }
    return true;
  }
}
