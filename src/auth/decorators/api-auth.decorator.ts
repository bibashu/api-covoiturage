import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';

/**
 * Combine ApiBearerAuth + réponse 401 pour Swagger.
 * @example @ApiAuthRequired()
 */
export const ApiAuthRequired = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Token manquant ou invalide' }),
  );