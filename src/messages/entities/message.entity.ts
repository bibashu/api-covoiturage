import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Booking } from '../../bookings/entities/bookings.entity';


@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  bookingId!: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookingId' })
  booking!: Booking;

  @Column()
  senderId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'senderId' })
  sender!: User;

  @ApiProperty({ example: 'Je serai là dans 5 minutes.' })
  @Column({ type: 'text' })
  content!: string;

  @ApiProperty({ example: false })
  @Column({ default: false })
  isRead!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  readAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}