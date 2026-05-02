import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, ParseUUIDPipe,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody,
} from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiAuthRequired } from '../auth/decorators/api-auth.decorator';
import { User } from '../users/entities/user.entity';

class SaveFcmTokenDto {
  @ApiProperty({ example: 'fxS7Z...:APA91b...' })
  @IsString()
  token!: string;
}

@ApiTags('notifications')
@ApiAuthRequired()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Mes 50 dernières notifications' })
  @ApiResponse({ status: 200 })
  findAll(@CurrentUser() user: User) {
    return this.notificationsService.findAll(user.id);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Mes notifications non lues' })
  findUnread(@CurrentUser() user: User) {
    return this.notificationsService.findUnread(user.id);
  }

  @Get('count')
  @ApiOperation({ summary: 'Nombre de notifications non lues' })
  @ApiResponse({ status: 200, schema: { properties: { count: { type: 'number' } } } })
  async countUnread(@CurrentUser() user: User) {
    const count = await this.notificationsService.countUnread(user.id);
    return { count };
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Tout marquer comme lu' })
  markAllRead(@CurrentUser() user: User) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  @ApiParam({ name: 'id', type: String })
  markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.notificationsService.markRead(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une notification' })
  @ApiParam({ name: 'id', type: String })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.notificationsService.remove(id, user.id);
  }

  @Post('fcm-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Enregistrer / mettre à jour le token FCM mobile' })
  @ApiBody({ type: SaveFcmTokenDto })
  saveFcmToken(
    @Body() dto: SaveFcmTokenDto,
    @CurrentUser() user: User,
  ) {
    return this.notificationsService.saveFcmToken(user.id, dto.token);
  }
}