import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  BOOKING_REQUEST         = 'booking_request',
  BOOKING_CONFIRMED       = 'booking_confirmed',
  BOOKING_REJECTED        = 'booking_rejected',
  BOOKING_CANCELLED       = 'booking_cancelled',
  TRIP_STARTING_SOON      = 'trip_starting_soon',
  TRIP_CANCELLED          = 'trip_cancelled',
  NEW_REVIEW              = 'new_review',
  NEW_MESSAGE             = 'new_message',
  PAYMENT_SUCCESS         = 'payment_success',
  PAYMENT_REFUNDED        = 'payment_refunded',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ApiProperty({ enum: NotificationType })
  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @ApiProperty({ example: 'Nouvelle demande de réservation' })
  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @ApiProperty({ example: 'Moussa souhaite réserver 1 place pour votre trajet.' })
  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'jsonb', nullable: true, default: null })
  data!: Record<string, any>;

  @ApiProperty({ example: false })
  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  readAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}