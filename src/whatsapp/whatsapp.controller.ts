import {
  Controller, Get, Post, Body,
  Query, Res, HttpCode, HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp.service';
import { Public } from '../auth/decorators/auth.decorators';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  /** Vérification webhook par Meta (GET) */
  @Public()
  @Get('webhook')
  @ApiOperation({ summary: 'Vérification webhook Meta WhatsApp' })
  verifyWebhook(
    @Query('hub.mode')          mode:      string,
    @Query('hub.verify_token')  token:     string,
    @Query('hub.challenge')     challenge: string,
    @Res() res: Response,
  ) {
    const result = this.whatsappService.verifyWebhook(mode, token, challenge);
    result ? res.status(200).send(result) : res.status(403).send('Forbidden');
  }

  /** Réception des événements WhatsApp (POST) */
  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Événements WhatsApp entrants' })
  receiveWebhook(@Body() body: any) {
    this.whatsappService.processWebhook(body);
    return { status: 'ok' };
  }
}
