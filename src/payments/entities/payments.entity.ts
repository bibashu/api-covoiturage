import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, OneToOne, JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Booking } from '../../bookings/entities/bookings.entity';


export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}

export enum PaymentMethod {
  CARD = 'card',
  MOBILE_MONEY = 'mobile_money',
  WALLET = 'wallet',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  bookingId!: string;

  @OneToOne(() => Booking)
  @JoinColumn({ name: 'bookingId' })
  booking!: Booking;

  @Column()
  payerId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'payerId' })
  payer!: User;

  @ApiProperty({ example: 2500 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @ApiProperty({ example: 'XOF' })
  @Column({ length: 3, default: 'XOF' })
  currency!: string;

  @ApiProperty({ enum: PaymentMethod })
  @Column({ type: 'enum', enum: PaymentMethod })
  method!: PaymentMethod;

  @ApiProperty({ enum: PaymentStatus })
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  @Column({ nullable: true })
  stripePaymentIntentId!: string;

  @Column({ nullable: true })
  stripeChargeId!: string;

  @Column({ nullable: true })
  failureReason!: string;

  @Column({ type: 'timestamptz', nullable: true })
  capturedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  refundedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}