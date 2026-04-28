import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

import { Booking } from '../../bookings/entities/bookings.entity';
import { Vehicle } from '../../vehicles/entities/vehicule.entity';


export enum TripStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  FULL = 'full',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  driverId!: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'driverId' })
  driver!: User;

  @Column()
  vehicleId!: string;

  @ManyToOne(() => Vehicle, { eager: true })
  @JoinColumn({ name: 'vehicleId' })
  vehicle!: Vehicle;

  @ApiProperty({ example: 'Dakar' })
  @Column({ length: 100 })
  departureCity!: string;

  @ApiProperty({ example: 'Thiès' })
  @Column({ length: 100 })
  arrivalCity!: string;

  @ApiProperty({ example: 'Plateau, Dakar' })
  @Column({ nullable: true })
  departureAddress!: string;

  @ApiProperty({ example: 'Centre-ville, Thiès' })
  @Column({ nullable: true })
  arrivalAddress!: string;

  @ApiProperty({ example: 14.6928 })
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  departureLat!: number;

  @ApiProperty({ example: -17.4467 })
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  departureLon!: number;

  @ApiProperty({ example: 14.7833 })
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  arrivalLat!: number;

  @ApiProperty({ example: -16.9167 })
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  arrivalLon!: number;

  @ApiProperty({ example: '2026-05-01T07:00:00Z' })
  @Column({ type: 'timestamptz' })
  departureTime!: Date;

  @ApiProperty({ example: '2026-05-01T09:00:00Z' })
  @Column({ type: 'timestamptz', nullable: true })
  estimatedArrivalTime!: Date;

  @ApiProperty({ example: 3 })
  @Column()
  availableSeats!: number;

  @ApiProperty({ example: 2500 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  pricePerSeat!: number;

  @ApiProperty({ enum: TripStatus })
  @Column({ type: 'enum', enum: TripStatus, default: TripStatus.PUBLISHED })
  status!: TripStatus;

  @ApiProperty({ example: false })
  @Column({ default: false })
  smokingAllowed!: boolean;

  @ApiProperty({ example: true })
  @Column({ default: false })
  petsAllowed!: boolean;

  @ApiProperty({ example: true })
  @Column({ default: false })
  musicAllowed!: boolean;

  @ApiProperty({ example: 'Je n\'accepte pas les bagages volumineux.' })
  @Column({ type: 'text', nullable: true })
  description!: string;

//   @OneToMany(() => TripStop, (stop) => stop.trip, {
//     cascade: true,
//     eager: true,
//   })
//   stops!: TripStop[];

  @OneToMany(() => Booking, (booking) => booking.trip)
  bookings!: Booking[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}