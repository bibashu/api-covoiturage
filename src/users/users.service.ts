import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { User, UserRole } from './entities/user.entity';
import { UpdateUserDto, UpdateEmailDto, UpdatePasswordDto } from './dto/update-user.dto';
import { QueryUsersDto, PaginatedResponseDto } from './dto/query-users.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';

export interface UserStats {
  averageRating: number;
  totalRatings: number;
  tripsAsDriver: number;
  tripsAsPassenger: number;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ─── READ ─────────────────────────────────────────────────────────────────

  async findAll(
    query: QueryUsersDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const { page = 1, limit = 20, role, search, isVerified, isActive } = query;
    const skip = (page - 1) * limit;

    const qb = this.userRepo.createQueryBuilder('user');

    if (isActive !== undefined) {
      qb.andWhere('user.isActive = :isActive', { isActive });
    } else {
      qb.andWhere('user.isActive = true');
    }

    if (role) {
      qb.andWhere('user.role = :role', { role });
    }

    if (isVerified !== undefined) {
      qb.andWhere('user.isVerified = :isVerified', { isVerified });
    }

    if (search) {
      qb.andWhere(
        '(user.firstName ILIKE :s OR user.lastName ILIKE :s OR user.email ILIKE :s)',
        { s: `%${search}%` },
      );
    }

    qb.orderBy('user.createdAt', 'DESC').skip(skip).take(limit);

    const [users, total] = await qb.getManyAndCount();
    const lastPage = Math.ceil(total / limit);

    return {
      data: users.map((u) => this.toDto(u)),
      total,
      page,
      limit,
      lastPage,
      hasNext: page < lastPage,
      hasPrev: page > 1,
    };
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.findOneOrFail(id);
    return this.toDto(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email, isActive: true } });
  }

  async getStats(userId: string): Promise<UserStats> {
    const user = await this.findOneOrFail(userId);

    const result = await this.userRepo.manager
      .createQueryBuilder()
      .select([
        `(SELECT COUNT(*) FROM trips WHERE "driverId" = :uid) AS "tripsAsDriver"`,
        `(SELECT COUNT(*) FROM bookings WHERE "passengerId" = :uid AND status = 'completed') AS "tripsAsPassenger"`,
      ])
      .setParameter('uid', userId)
      .getRawOne();

    return {
      averageRating: Number(user.averageRating),
      totalRatings: user.totalRatings,
      tripsAsDriver: parseInt(result?.tripsAsDriver ?? '0', 10),
      tripsAsPassenger: parseInt(result?.tripsAsPassenger ?? '0', 10),
    };
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateUserDto,
    requesterId: string,
  ): Promise<UserResponseDto> {
    const user = await this.findOneOrFail(id);
    this.assertOwnerOrAdmin(user, requesterId);

    Object.assign(user, dto);
    const saved = await this.userRepo.save(user);
    this.logger.log(`Profil mis à jour : ${saved.id}`);
    return this.toDto(saved);
  }

  async updateEmail(
    id: string,
    dto: UpdateEmailDto,
    requesterId: string,
  ): Promise<UserResponseDto> {
    const user = await this.findOneOrFail(id);
    this.assertOwnerOrAdmin(user, requesterId);

    const valid = await user.validatePassword(dto.currentPassword);
    if (!valid) {
      throw new BadRequestException('Mot de passe incorrect.');
    }

    const exists = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (exists && exists.id !== id) {
      throw new ConflictException('Cet email est déjà utilisé.');
    }

    user.email = dto.email;
    const saved = await this.userRepo.save(user);
    return this.toDto(saved);
  }

  async updatePassword(
    id: string,
    dto: UpdatePasswordDto,
    requesterId: string,
  ): Promise<{ message: string }> {
    const user = await this.findOneOrFail(id);
    this.assertOwnerOrAdmin(user, requesterId);

    const valid = await user.validatePassword(dto.currentPassword);
    if (!valid) {
      throw new BadRequestException('Mot de passe actuel incorrect.');
    }

    user.password = dto.newPassword;
    // @BeforeUpdate() dans l'entité hashera automatiquement
    await this.userRepo.save(user);
    // Invalide le refresh token pour forcer la reconnexion
    await this.userRepo.update(id, { refreshToken: null as any });

    return { message: 'Mot de passe modifié avec succès.' };
  }

  // ─── PHOTO ────────────────────────────────────────────────────────────────

  async uploadProfilePhoto(
    userId: string,
    file: Express.Multer.File,
    requesterId: string,
  ): Promise<UserResponseDto> {
    const user = await this.findOneOrFail(userId);
    this.assertOwnerOrAdmin(user, requesterId);

    // Supprime l'ancienne photo Cloudinary si elle existe
    if (user.photoPublicId) {
      await this.cloudinaryService.deletePhoto(user.photoPublicId);
    }

    const result = await this.cloudinaryService.uploadProfilePhoto(file, userId);

    user.photoUrl = result.secureUrl;
    user.photoPublicId = result.publicId;
    const saved = await this.userRepo.save(user);

    this.logger.log(`Photo mise à jour pour l'utilisateur : ${userId}`);
    return this.toDto(saved);
  }

  async deleteProfilePhoto(
    userId: string,
    requesterId: string,
  ): Promise<UserResponseDto> {
    const user = await this.findOneOrFail(userId);
    this.assertOwnerOrAdmin(user, requesterId);

    if (!user.photoPublicId) {
      throw new BadRequestException("Aucune photo de profil à supprimer.");
    }

    await this.cloudinaryService.deletePhoto(user.photoPublicId);

    user.photoUrl = null as unknown as string;
    user.photoPublicId = null as unknown as string;
    const saved = await this.userRepo.save(user);
    return this.toDto(saved);
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────

  async remove(id: string, requesterId: string): Promise<void> {
    const user = await this.findOneOrFail(id);
    this.assertOwnerOrAdmin(user, requesterId);

    // Soft delete : on désactive le compte sans purger les données
    user.isActive = false;
    user.refreshToken = null as unknown as string;
    await this.userRepo.save(user);
    this.logger.log(`Compte désactivé : ${id}`);
  }

  // Purge définitive réservée à l'admin
  async hardDelete(id: string): Promise<void> {
    const user = await this.findOneOrFail(id);
    if (user.photoPublicId) {
      await this.cloudinaryService.deletePhoto(user.photoPublicId);
    }
    await this.userRepo.remove(user);
    this.logger.warn(`Compte supprimé définitivement : ${id}`);
  }

  // ─── NOTE MOYENNE ─────────────────────────────────────────────────────────

  /**
   * Recalcule la note moyenne d'un utilisateur depuis la table reviews.
   * Appelé par ReviewsService après chaque création ou suppression d'avis.
   */
  async updateAverageRating(userId: string): Promise<void> {
    const result = await this.userRepo.manager
      .createQueryBuilder()
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(r.id)', 'count')
      .from('reviews', 'r')
      .where('r."targetId" = :userId', { userId })
      .getRawOne();

    const avg = parseFloat(result?.avg ?? '0');
    const count = parseInt(result?.count ?? '0', 10);

    await this.userRepo.update(userId, {
      averageRating: Math.round(avg * 100) / 100,
      totalRatings: count,
    });

    this.logger.log(
      `Note moyenne mise à jour pour ${userId} : ${avg.toFixed(2)} (${count} avis)`,
    );
  }

  // ─── ADMIN ────────────────────────────────────────────────────────────────

  async verify(id: string): Promise<UserResponseDto> {
    const user = await this.findOneOrFail(id);
    user.isVerified = true;
    const saved = await this.userRepo.save(user);
    return this.toDto(saved);
  }

  async restore(id: string): Promise<UserResponseDto> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Utilisateur ${id} introuvable`);
    user.isActive = true;
    const saved = await this.userRepo.save(user);
    return this.toDto(saved);
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  async findOneOrFail(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id, isActive: true },
    });
    if (!user) throw new NotFoundException(`Utilisateur ${id} introuvable`);
    return user;
  }

  private assertOwnerOrAdmin(user: User, requesterId: string): void {
    const requester = { id: requesterId } as User;
    if (user.id !== requesterId) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que votre propre profil.',
      );
    }
  }

  private toDto(user: User): UserResponseDto {
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }
}