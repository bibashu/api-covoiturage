import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marque une route comme publique (bypasse JwtAuthGuard).
 * @example @Public()
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);