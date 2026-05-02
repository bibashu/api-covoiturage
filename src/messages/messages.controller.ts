import {
  Controller, Get, Post, Patch,
  Body, Param, ParseUUIDPipe,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiParam,
} from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiAuthRequired } from '../auth/decorators/api-auth.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('messages')
@ApiAuthRequired()
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Envoyer un message (fallback HTTP si WS indisponible)' })
  @ApiResponse({ status: 201, type: MessageResponseDto })
  create(
    @Body() dto: SendMessageDto,
    @CurrentUser() user: User,
  ): Promise<MessageResponseDto> {
    return this.messagesService.create(dto, user.id);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Mes conversations actives' })
  getConversations(@CurrentUser() user: User) {
    return this.messagesService.getConversations(user.id);
  }

  @Get(':bookingId')
  @ApiOperation({ summary: 'Historique d\'une conversation' })
  @ApiParam({ name: 'bookingId', type: String })
  @ApiResponse({ status: 200, type: [MessageResponseDto] })
  getHistory(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @CurrentUser() user: User,
  ): Promise<MessageResponseDto[]> {
    return this.messagesService.getHistory(bookingId, user.id);
  }

  @Patch(':bookingId/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Marquer tous les messages d\'une conversation comme lus' })
  @ApiParam({ name: 'bookingId', type: String })
  markAllRead(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.messagesService.markAllRead(bookingId, user.id);
  }
}