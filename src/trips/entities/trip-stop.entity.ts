import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Trip } from './trips.entity';

@Entity('trip_stops')
export class TripStop {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  tripId!: string;

  @ManyToOne(() => Trip, (trip) => trip.stops, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tripId' })
  trip!: Trip;

  @ApiProperty({ example: 'Mbour' })
  @Column({ type: 'varchar', length: 100 })
  city!: string;

  @ApiProperty({ example: 'Gare routière de Mbour' })
  @Column({ type: 'varchar', nullable: true, default: null })
  address!: string;

  @ApiProperty({ example: 14.3673 })
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude!: number;

  @ApiProperty({ example: -16.9659 })
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude!: number;

  @ApiProperty({ example: 1 })
  @Column({ type: 'int' })
  order!: number;

  @ApiProperty({ example: '2026-05-01T08:00:00Z' })
  @Column({ type: 'timestamptz', nullable: true, default: null })
  estimatedTime!: Date;

  @ApiProperty({ example: 1500 })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: null })
  priceFromDeparture!: number;
}