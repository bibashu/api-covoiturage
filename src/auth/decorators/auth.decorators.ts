// ─── src/auth/decorators/auth.decorators.ts ──────────────────────────────────
import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity';

export const IS_PUBLIC_KEY         = 'isPublic';
export const ROLES_KEY             = 'roles';
export const SKIP_PROFILE_KEY      = 'skipProfileCheck';

/** Route sans JWT */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Restreindre aux rôles */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/** Accessible même si le profil est incomplet (status=PENDING) */
export const SkipProfileCheck = () => SetMetadata(SKIP_PROFILE_KEY, true);

/** Swagger : Bearer auth + 401 */
export const ApiAuthRequired = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Token manquant ou invalide' }),
  );
