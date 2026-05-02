import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Booking } from '../../bookings/entities/bookings.entity';

export enum MessageType {
  TEXT  = 'text',
  SYSTEM = 'system',  // Messages automatiques (confirmation, annulation…)
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  bookingId!: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookingId' })
  booking!: Booking;

  @Column({ type: 'varchar' })
  senderId!: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender!: User;

  @ApiProperty({ example: 'Je serai là dans 5 minutes.' })
  @Column({ type: 'text' })
  content!: string;

  @ApiProperty({ enum: MessageType })
  @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
  type!: MessageType;

  @ApiProperty({ example: false })
  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  readAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}