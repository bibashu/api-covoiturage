import {
  WebSocketGateway, WebSocketServer,
  OnGatewayConnection, OnGatewayDisconnect,
  SubscribeMessage, MessageBody, ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger, UnauthorizedException } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  // Map userId → Set<socketId> (un user peut avoir plusieurs onglets)
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ─── CONNEXION ─────────────────────────────────────────────────────────────

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) throw new UnauthorizedException('Token manquant.');

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.get('JWT_SECRET'),
      });

      const userId: string = payload.sub;

      // Attacher l'userId au socket pour usage ultérieur
      client.data.userId = userId;

      // Rejoindre la room personnelle
      client.join(`user:${userId}`);

      // Enregistrer le socket
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      this.logger.log(`WS connecté : ${userId} (socket ${client.id})`);
      client.emit('connected', { userId, message: 'Connexion établie.' });
    } catch {
      client.emit('error', { message: 'Token invalide.' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      this.userSockets.get(userId)?.delete(client.id);
      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.logger.log(`WS déconnecté : socket ${client.id}`);
  }

  // ─── MESSAGES CLIENT ──────────────────────────────────────────────────────

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { time: new Date().toISOString() });
  }

  @SubscribeMessage('mark_read')
  handleMarkRead(
    @MessageBody() data: { notificationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Le client signale qu'il a lu une notification
    // Le service REST /notifications/:id/read gère la persistance
    this.logger.log(`Notification lue via WS : ${data.notificationId}`);
  }

  // ─── MÉTHODES SERVEUR (appelées par NotificationsService) ─────────────────

  sendToUser(userId: string, event: string, payload: any) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  isUserOnline(userId: string): boolean {
    return (this.userSockets.get(userId)?.size ?? 0) > 0;
  }
}