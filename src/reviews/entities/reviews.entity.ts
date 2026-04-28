import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
  Check,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Booking } from '../../bookings/entities/bookings.entity';


export enum ReviewTarget {
  DRIVER = 'driver',
  PASSENGER = 'passenger',
}

@Entity('reviews')
@Check('"rating" >= 1 AND "rating" <= 5')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  bookingId!: string;

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'bookingId' })
  booking!: Booking;

  @Column()
  authorId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'authorId' })
  author!: User;

  @Column()
  targetId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'targetId' })
  target!: User;

  @ApiProperty({ enum: ReviewTarget })
  @Column({ type: 'enum', enum: ReviewTarget })
  targetType!: ReviewTarget;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @Column()
  rating!: number;

  @ApiProperty({ example: 'Conducteur ponctuel et sympathique.' })
  @Column({ type: 'text', nullable: true })
  comment!: string;

  @ApiProperty({ example: false })
  @Column({ default: false })
  isReported!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}