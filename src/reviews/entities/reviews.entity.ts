import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
  Check, Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Booking } from '../../bookings/entities/bookings.entity';

export enum ReviewTarget {
  DRIVER    = 'driver',
  PASSENGER = 'passenger',
}

@Entity('reviews')
@Check('"rating" >= 1 AND "rating" <= 5')
@Unique(['bookingId', 'authorId'])   // Un seul avis par réservation et par auteur
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  bookingId!: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookingId' })
  booking!: Booking;

  @Column({ type: 'varchar' })
  authorId!: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author!: User;

  @Column({ type: 'varchar' })
  targetId!: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'targetId' })
  target!: User;

  @ApiProperty({ enum: ReviewTarget })
  @Column({ type: 'enum', enum: ReviewTarget })
  targetType!: ReviewTarget;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @Column({ type: 'int' })
  rating!: number;

  @ApiProperty({ example: 'Conducteur ponctuel et sympathique.' })
  @Column({ type: 'text', nullable: true, default: null })
  comment!: string;

  @ApiProperty({ example: false })
  @Column({ type: 'boolean', default: false })
  isReported!: boolean;

  @Column({ type: 'varchar', nullable: true, default: null })
  reportReason!: string;

  @CreateDateColumn()
  createdAt!: Date;
}