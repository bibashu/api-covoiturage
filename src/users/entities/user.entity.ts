import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

export enum UserRole {
  DRIVER    = 'driver',
  PASSENGER = 'passenger',
  BOTH      = 'both',
  ADMIN     = 'admin',
}

export enum UserStatus {
  PENDING   = 'pending',   // numéro enregistré, OTP non vérifié OU profil incomplet
  ACTIVE    = 'active',    // profil complet, accès total
  SUSPENDED = 'suspended',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ── Étape 1 : seul le téléphone est requis ─────────────────────────────
  @Column({ type: 'varchar', unique: true, length: 20 })
  phone!: string;

  // ── Étape 3 : nom + prénom ─────────────────────────────────────────────
  @Column({ type: 'varchar', length: 100, nullable: true, default: null })
  firstName!: string;

  @Column({ type: 'varchar', length: 100, nullable: true, default: null })
  lastName!: string;

  // ── OTP ────────────────────────────────────────────────────────────────
  @Exclude()
  @Column({ type: 'varchar', nullable: true, default: null })
  otpCode!: string;

  @Exclude()
  @Column({ type: 'timestamptz', nullable: true, default: null })
  otpExpiresAt!: Date;

  @Exclude()
  @Column({ type: 'int', default: 0 })
  otpAttempts!: number;

  @Exclude()
  @Column({ type: 'timestamptz', nullable: true, default: null })
  otpBlockedUntil!: Date;

  // ── Statut & rôle ──────────────────────────────────────────────────────
  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING })
  status!: UserStatus;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.BOTH })
  role!: UserRole;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  // ── Photo ──────────────────────────────────────────────────────────────
  @Column({ type: 'varchar', nullable: true, default: null })
  photoUrl!: string;

  @Exclude()
  @Column({ type: 'varchar', nullable: true, default: null })
  photoPublicId!: string;

  // ── Notes ──────────────────────────────────────────────────────────────
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating!: number;

  @Column({ type: 'int', default: 0 })
  totalRatings!: number;

  // ── Tokens ─────────────────────────────────────────────────────────────
  @Exclude()
  @Column({ type: 'varchar', nullable: true, default: null })
  refreshToken!: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  fcmToken!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // ── Computed ───────────────────────────────────────────────────────────
  get fullName(): string {
    return this.firstName && this.lastName
      ? `${this.firstName} ${this.lastName}`
      : this.phone;
  }

  get isProfileComplete(): boolean {
    return !!(
      this.firstName &&
      this.lastName &&
      this.status === UserStatus.ACTIVE
    );
  }
}
