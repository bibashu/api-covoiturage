import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';

export enum UserRole {
  DRIVER = 'driver',
  PASSENGER = 'passenger',
  BOTH = 'both',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @ApiProperty({ example: 'uuid-v4' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'Moussa' })
  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @ApiProperty({ example: 'Diallo' })
  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @ApiProperty({ example: 'moussa@example.com' })
  @Column({ type: 'varchar', unique: true, length: 255 })
  email!: string;

  @Exclude()
  @Column({ type: 'varchar' })
  password!: string;

  @ApiProperty({ example: '+221770000000', nullable: true })
  @Column({ type: 'varchar', nullable: true, length: 20, default: null })
  phone!: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/...', nullable: true })
  @Column({ type: 'varchar', nullable: true, default: null })
  photoUrl!: string;

  @Exclude()
  @Column({ type: 'varchar', nullable: true, default: null })
  photoPublicId!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.BOTH })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.BOTH })
  role!: UserRole;

  @ApiProperty({ example: 4.8 })
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating!: number;

  @ApiProperty({ example: 12 })
  @Column({ type: 'int', default: 0 })
  totalRatings!: number;

  @ApiProperty({ example: false })
  @Column({ type: 'boolean', default: false })
  isVerified!: boolean;

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Exclude()
  @Column({ type: 'varchar', nullable: true, default: null })
  refreshToken!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'varchar', nullable: true, default: null })
  fcmToken!: string;

  @UpdateDateColumn()
  updatedAt!: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async validatePassword(plain: string): Promise<boolean> {
    return bcrypt.compare(plain, this.password);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
