import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Trip } from '../../trips/entities/trips.entity';

export enum BookingStatus {
  PENDING                = 'pending',
  CONFIRMED              = 'confirmed',
  REJECTED               = 'rejected',
  CANCELLED_BY_PASSENGER = 'cancelled_by_passenger',
  CANCELLED_BY_DRIVER    = 'cancelled_by_driver',
  COMPLETED              = 'completed',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  passengerId!: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'passengerId' })
  passenger!: User;

  @Column({ type: 'varchar' })
  tripId!: string;

  @ManyToOne(() => Trip, (trip) => trip.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tripId' })
  trip!: Trip;

  @ApiProperty({ example: 1 })
  @Column({ type: 'int', default: 1 })
  seatsBooked!: number;

  @ApiProperty({ example: 2500 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount!: number;

  @ApiProperty({ enum: BookingStatus })
  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status!: BookingStatus;

  @ApiProperty({ example: 'Je serai à l\'arrêt principal.' })
  @Column({ type: 'text', nullable: true, default: null })
  passengerNote!: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  cancellationReason!: string;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  confirmedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  cancelledAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}