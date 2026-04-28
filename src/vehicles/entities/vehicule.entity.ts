import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

@Entity('vehicles')
export class Vehicle {
  @ApiProperty({ example: 'uuid-v4' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  ownerId!: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner!: User;

  @ApiProperty({ example: 'Toyota' })
  @Column({ type: 'varchar', length: 100 })
  brand!: string;

  @ApiProperty({ example: 'Corolla' })
  @Column({ type: 'varchar', length: 100 })
  model!: string;

  @ApiProperty({ example: 2020 })
  @Column({ type: 'int' })
  year!: number;

  @ApiProperty({ example: 'Blanc' })
  @Column({ type: 'varchar', length: 50 })
  color!: string;

  @ApiProperty({ example: 'DK-1234-AB' })
  @Column({ type: 'varchar', unique: true, length: 20 })
  licensePlate!: string;

  @ApiProperty({ example: 4 })
  @Column({ type: 'int' })
  seats!: number;

  @ApiProperty({ example: 'https://res.cloudinary.com/...', nullable: true })
  @Column({ type: 'varchar', nullable: true, default: null })
  photoUrl!: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  photoPublicId!: string;

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}