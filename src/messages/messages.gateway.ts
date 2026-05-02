import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { MessagesService } from './messages.service';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/messages',
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(MessagesGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly messagesService: MessagesService,
  ) {}

  // ─── CONNEXION ─────────────────────────────────────────────────────────────

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) throw new Error('Token manquant.');

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.get('JWT_SECRET'),
      });

      client.data.userId = payload.sub;
      client.data.userFullName =
        `${payload.firstName ?? ''} ${payload.lastName ?? ''}`.trim();

      this.logger.log(`Messages WS connecté : ${payload.sub}`);
      client.emit('connected', { userId: payload.sub });
    } catch (err) {
      client.emit('error', { message: 'Authentification échouée.' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Messages WS déconnecté : ${client.data?.userId}`);
  }

  // ─── REJOINDRE UNE CONVERSATION ────────────────────────────────────────────

  @SubscribeMessage('join_conversation')
  async handleJoin(
    @MessageBody() data: { bookingId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    try {
      // Vérifie que l'utilisateur est bien participant
      const canAccess = await this.messagesService.canAccessConversation(
        data.bookingId,
        userId,
      );
      if (!canAccess) {
        client.emit('error', {
          message: 'Accès non autorisé à cette conversation.',
        });
        return;
      }

      const room = `booking:${data.bookingId}`;
      client.join(room);

      // Charger l'historique des messages
      const history = await this.messagesService.getHistory(
        data.bookingId,
        userId,
      );

      client.emit('joined', {
        bookingId: data.bookingId,
        history,
      });

      this.logger.log(`${userId} a rejoint la conversation ${data.bookingId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';

      client.emit('error', { message });
    }
  }

  @SubscribeMessage('leave_conversation')
  handleLeave(
    @MessageBody() data: { bookingId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`booking:${data.bookingId}`);
    this.logger.log(
      `${client.data.userId} a quitté la conversation ${data.bookingId}`,
    );
  }

  // ─── ENVOYER UN MESSAGE ────────────────────────────────────────────────────

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: { bookingId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    try {
      if (!data.content?.trim()) {
        client.emit('error', { message: 'Le message ne peut pas être vide.' });
        return;
      }

      const message = await this.messagesService.create(
        { bookingId: data.bookingId, content: data.content.trim() },
        userId,
      );

      const room = `booking:${data.bookingId}`;

      // Diffuser à tous les membres de la room (expéditeur inclus)
      this.server.to(room).emit('new_message', message);

      this.logger.log(`Message de ${userId} dans booking:${data.bookingId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';

      client.emit('error', { message });
    }
  }

  // ─── INDICATEUR D'ÉCRITURE ────────────────────────────────────────────────

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { bookingId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `booking:${data.bookingId}`;
    // Diffuse à tout le monde SAUF l'expéditeur
    client.to(room).emit('user_typing', {
      userId: client.data.userId,
      isTyping: data.isTyping,
    });
  }

  // ─── MARQUER COMME LU ─────────────────────────────────────────────────────

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @MessageBody() data: { bookingId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    try {
      await this.messagesService.markAllRead(data.bookingId, userId);
      const room = `booking:${data.bookingId}`;
      // Notifier l'autre participant que ses messages ont été lus
      client.to(room).emit('message_read', {
        bookingId: data.bookingId,
        readBy: userId,
        readAt: new Date(),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';

      client.emit('error', { message });
    }
  }

  // ─── MÉTHODE PUBLIQUE (pour les messages système) ─────────────────────────

  sendSystemMessage(bookingId: string, content: string, messageDto: any) {
    this.server.to(`booking:${bookingId}`).emit('new_message', messageDto);
  }
}
