import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';

export const ROLES_KEY = 'roles';

/**
 * Restreint l'accès à des rôles spécifiques.
 * @example @Roles(UserRole.DRIVER, UserRole.ADMIN)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);