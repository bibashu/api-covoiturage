import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';

/**
 * Injecte l'utilisateur authentifié dans le paramètre de la méthode.
 * @example async getProfile(@CurrentUser() user: User)
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);