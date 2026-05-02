import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as admin from 'firebase-admin';
import { Notification, NotificationType } from './entities/notification.entity';

import { FIREBASE_APP } from './firebase.provider';
import { InjectRepository as IR } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { NotificationsGateway } from './notification.gateway';

export interface SendNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly gateway: NotificationsGateway,
    @Inject(FIREBASE_APP)
    private readonly firebaseApp: admin.app.App,
  ) {}

  // ─── ENVOYER UNE NOTIFICATION ─────────────────────────────────────────────

  async send(opts: SendNotificationOptions): Promise<Notification> {
    // 1. Persister en base
    const notif = this.notifRepo.create({
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      data: opts.data ?? {},
    });
    const saved = await this.notifRepo.save(notif);

    // 2. Envoyer via WebSocket (temps réel si connecté)
    this.gateway.sendToUser(opts.userId, 'notification', {
      id: saved.id,
      type: saved.type,
      title: saved.title,
      body: saved.body,
      data: saved.data,
      createdAt: saved.createdAt,
    });

    // 3. Push Firebase si l'utilisateur est hors ligne
    if (!this.gateway.isUserOnline(opts.userId)) {
      await this.sendPush(opts.userId, opts.title, opts.body, opts.data);
    }

    return saved;
  }

  // ─── MÉTHODES MÉTIER ──────────────────────────────────────────────────────

  async notifyBookingRequest(
    driverId: string,
    passengerName: string,
    tripId: string,
    bookingId: string,
  ): Promise<void> {
    await this.send({
      userId: driverId,
      type: NotificationType.BOOKING_REQUEST,
      title: 'Nouvelle demande de réservation',
      body: `${passengerName} souhaite réserver une place sur votre trajet.`,
      data: { tripId, bookingId },
    });
  }

  async notifyBookingConfirmed(
    passengerId: string,
    driverName: string,
    tripId: string,
    bookingId: string,
  ): Promise<void> {
    await this.send({
      userId: passengerId,
      type: NotificationType.BOOKING_CONFIRMED,
      title: 'Réservation confirmée ! 🎉',
      body: `${driverName} a accepté votre demande de réservation.`,
      data: { tripId, bookingId },
    });
  }

  async notifyBookingRejected(
    passengerId: string,
    driverName: string,
    bookingId: string,
  ): Promise<void> {
    await this.send({
      userId: passengerId,
      type: NotificationType.BOOKING_REJECTED,
      title: 'Réservation refusée',
      body: `${driverName} n'a pas pu accepter votre demande.`,
      data: { bookingId },
    });
  }

  async notifyBookingCancelled(
    userId: string,
    cancellerName: string,
    bookingId: string,
    byDriver: boolean,
  ): Promise<void> {
    await this.send({
      userId,
      type: NotificationType.BOOKING_CANCELLED,
      title: 'Réservation annulée',
      body: byDriver
        ? `${cancellerName} a annulé votre réservation confirmée.`
        : `${cancellerName} a annulé sa réservation.`,
      data: { bookingId },
    });
  }

  async notifyTripStartingSoon(
    passengerIds: string[],
    departureCity: string,
    departureTime: Date,
    tripId: string,
  ): Promise<void> {
    const time = departureTime.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    await Promise.all(
      passengerIds.map((uid) =>
        this.send({
          userId: uid,
          type: NotificationType.TRIP_STARTING_SOON,
          title: 'Votre trajet commence bientôt ⏰',
          body: `Départ de ${departureCity} à ${time}.`,
          data: { tripId },
        }),
      ),
    );
  }

  async notifyNewReview(
    targetId: string,
    authorName: string,
    rating: number,
    reviewId: string,
  ): Promise<void> {
    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    await this.send({
      userId: targetId,
      type: NotificationType.NEW_REVIEW,
      title: `Nouvel avis reçu ${stars}`,
      body: `${authorName} vous a laissé un avis.`,
      data: { reviewId, rating },
    });
  }

  // ─── READ ─────────────────────────────────────────────────────────────────

  async findAll(userId: string) {
    return this.notifRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async findUnread(userId: string) {
    return this.notifRepo.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' },
    });
  }

  async countUnread(userId: string): Promise<number> {
    return this.notifRepo.count({ where: { userId, isRead: false } });
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    const notif = await this.notifRepo.findOne({ where: { id } });
    if (!notif) throw new NotFoundException(`Notification ${id} introuvable.`);
    if (notif.userId !== userId) throw new ForbiddenException('Accès refusé.');

    notif.isRead = true;
    notif.readAt = new Date();
    return this.notifRepo.save(notif);
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notifRepo.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async remove(id: string, userId: string): Promise<void> {
    const notif = await this.notifRepo.findOne({ where: { id } });
    if (!notif) throw new NotFoundException(`Notification ${id} introuvable.`);
    if (notif.userId !== userId) throw new ForbiddenException('Accès refusé.');
    await this.notifRepo.remove(notif);
  }

  // ─── FCM TOKEN ────────────────────────────────────────────────────────────

  async saveFcmToken(userId: string, token: string): Promise<void> {
    await this.userRepo.update(userId, { fcmToken: token });
    this.logger.log(`FCM token enregistré pour ${userId}`);
  }

  // ─── PUSH FIREBASE ────────────────────────────────────────────────────────

  private async sendPush(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user?.fcmToken) return;

      await admin.messaging(this.firebaseApp).send({
        token: user.fcmToken,
        notification: { title, body },
        data: data
          ? Object.fromEntries(
              Object.entries(data).map(([k, v]) => [k, String(v)]),
            )
          : undefined,
        android: { priority: 'high' },
        apns: {
          payload: { aps: { sound: 'default', badge: 1 } },
        },
      });
      this.logger.log(`Push envoyé à ${userId}`);
    } catch (err) {
      const error = err as any;
      this.logger.warn(`Échec push pour ${userId} : ${error.message}`);
      // Si token invalide, on le supprime
      if (err instanceof Error) {
        if (error.code === 'messaging/registration-token-not-registered') {
          await this.userRepo.update(userId, { fcmToken: null as any });
        }
      }
    }
  }
}
