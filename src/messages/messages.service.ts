import { NotificationsService } from 'src/notifications/notifications.service';


import {
  Injectable, NotFoundException,
  ForbiddenException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Message, MessageType } from './entities/message.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { BookingsService } from '../bookings/bookings.service';

import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    private readonly bookingsService: BookingsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── CREATE ───────────────────────────────────────────────────────────────

  async create(
    dto: SendMessageDto,
    senderId: string,
  ): Promise<MessageResponseDto> {
    const booking = await this.bookingsService.findOneOrFail(dto.bookingId);

    if (!(await this.canAccessConversation(dto.bookingId, senderId))) {
      throw new ForbiddenException(
        'Vous n\'êtes pas participant à cette conversation.',
      );
    }

    const message = this.messageRepo.create({
      bookingId: dto.bookingId,
      senderId,
      content: dto.content,
      type: MessageType.TEXT,
    });

    const saved = await this.messageRepo.save(message);

    // Notifier l'autre participant via push/notification
    const receiverId =
      booking.passengerId === senderId
        ? booking.trip.driverId
        : booking.passengerId;

    await this.notificationsService.send({
      userId: receiverId,
      type: NotificationType.NEW_MESSAGE,
      title: `Message de ${saved.sender?.firstName ?? 'Quelqu\'un'}`,
      body: dto.content.length > 60
        ? dto.content.substring(0, 60) + '…'
        : dto.content,
      data: { bookingId: dto.bookingId, messageId: saved.id },
    });

    return this.toDto(saved);
  }

  // Message système automatique (confirmation, annulation…)
  async createSystemMessage(
    bookingId: string,
    content: string,
  ): Promise<MessageResponseDto> {
    const message = this.messageRepo.create({
      bookingId,
      senderId: null as unknown as string, 
      content,
      type: MessageType.SYSTEM,
      isRead: true,
    });
    const saved = await this.messageRepo.save(message);
    return this.toDto(saved);
  }

  // ─── READ ─────────────────────────────────────────────────────────────────

  async getHistory(
    bookingId: string,
    requesterId: string,
    limit = 50,
  ): Promise<MessageResponseDto[]> {
    if (!(await this.canAccessConversation(bookingId, requesterId))) {
      throw new ForbiddenException('Accès refusé à cette conversation.');
    }

    const messages = await this.messageRepo.find({
      where: { bookingId },
      order: { createdAt: 'ASC' },
      take: limit,
    });

    return messages.map((m) => this.toDto(m));
  }

async getConversations(userId: string): Promise<any[]> {
  const result = await this.messageRepo
    .createQueryBuilder('msg')
    .innerJoin('msg.booking', 'booking')
    .innerJoin('booking.trip', 'trip') // ✅ AJOUT IMPORTANT
    .where(
      '(booking.passengerId = :uid OR trip.driverId = :uid)',
      { uid: userId },
    )
    .select([
      'msg.bookingId AS "bookingId"',
      'MAX(msg.createdAt) AS "lastMessageAt"',
      'COUNT(CASE WHEN msg.isRead = false AND msg.senderId != :uid THEN 1 END) AS "unreadCount"',
    ])
    .setParameter('uid', userId)
    .groupBy('msg.bookingId')
    .orderBy('"lastMessageAt"', 'DESC')
    .getRawMany();

  return result;
}

  // ─── MARQUER COMME LU ─────────────────────────────────────────────────────

  async markAllRead(bookingId: string, userId: string): Promise<void> {
    // Marque comme lus tous les messages que l'utilisateur n'a pas envoyés
    await this.messageRepo
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true, readAt: new Date() })
      .where(
        'bookingId = :bookingId AND senderId != :userId AND isRead = false',
        { bookingId, userId },
      )
      .execute();
  }

  // ─── ACCÈS ────────────────────────────────────────────────────────────────

  async canAccessConversation(
    bookingId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const booking = await this.bookingsService.findOneOrFail(bookingId);
      return (
        booking.passengerId === userId ||
        booking.trip?.driverId === userId
      );
    } catch {
      return false;
    }
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  private toDto(message: Message): MessageResponseDto {
    return plainToInstance(MessageResponseDto, message, {
      excludeExtraneousValues: true,
    });
  }
}