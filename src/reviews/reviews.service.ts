import {
  Injectable, NotFoundException, BadRequestException,
  ForbiddenException, ConflictException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';

import { CreateReviewDto } from './dto/create-review.dto';
import { ReportReviewDto } from './dto/report-review.dto';
import { ReviewResponseDto, UserRatingSummaryDto } from './dto/review-response.dto';
import { BookingsService } from '../bookings/bookings.service';
import { UsersService } from '../users/users.service';
import { BookingStatus } from '../bookings/entities/bookings.entity';
import { Review, ReviewTarget } from './entities/reviews.entity';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    private readonly bookingsService: BookingsService,
    private readonly usersService: UsersService,
  ) {}

  // ─── CREATE ───────────────────────────────────────────────────────────────

  async create(
    dto: CreateReviewDto,
    authorId: string,
  ): Promise<ReviewResponseDto> {
    const booking = await this.bookingsService.findOneOrFail(dto.bookingId);

    // Le trajet doit être terminé
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException(
        'Vous ne pouvez laisser un avis qu\'après un trajet terminé.',
      );
    }

    // L'auteur doit être participant (passager ou conducteur)
    const isPassenger = booking.passengerId === authorId;
    const isDriver    = booking.trip?.driverId === authorId;

    if (!isPassenger && !isDriver) {
      throw new ForbiddenException(
        'Vous n\'étiez pas participant à ce trajet.',
      );
    }

    // Vérifier qu'un avis n'existe pas déjà
    const existing = await this.reviewRepo.findOne({
      where: { bookingId: dto.bookingId, authorId },
    });
    if (existing) {
      throw new ConflictException(
        'Vous avez déjà laissé un avis pour cette réservation.',
      );
    }

    // Déterminer la cible et le type
    let targetId: string;
    let targetType: ReviewTarget;

    if (isPassenger) {
      // Le passager note le conducteur
      targetId   = booking.trip.driverId;
      targetType = ReviewTarget.DRIVER;
    } else {
      // Le conducteur note le passager
      targetId   = booking.passengerId;
      targetType = ReviewTarget.PASSENGER;
    }

    const review = this.reviewRepo.create({
      ...dto,
      authorId,
      targetId,
      targetType,
    });

    const saved = await this.reviewRepo.save(review);

    // Recalcule la note moyenne de la cible
    await this.usersService.updateAverageRating(targetId);

    this.logger.log(
      `Avis créé : ${saved.id} — ${authorId} → ${targetId} (${rating(dto.rating)})`,
    );
    return this.toDto(saved);
  }

  // ─── READ ─────────────────────────────────────────────────────────────────

  async findByUser(userId: string): Promise<UserRatingSummaryDto> {
    await this.usersService.findOneOrFail(userId);

    const reviews = await this.reviewRepo.find({
      where: { targetId: userId, isReported: false },
      order: { createdAt: 'DESC' },
    });

    const user = await this.usersService.findOneOrFail(userId);

    return {
      averageRating: Number(user.averageRating),
      totalRatings:  user.totalRatings,
      reviews: reviews.map((r) => this.toDto(r)),
    };
  }

  async findByBooking(
    bookingId: string,
    requesterId: string,
  ): Promise<ReviewResponseDto[]> {
    const booking = await this.bookingsService.findOneOrFail(bookingId);

    const isParticipant =
      booking.passengerId === requesterId ||
      booking.trip?.driverId === requesterId;

    if (!isParticipant) {
      throw new ForbiddenException('Accès refusé.');
    }

    const reviews = await this.reviewRepo.find({
      where: { bookingId },
      order: { createdAt: 'DESC' },
    });

    return reviews.map((r) => this.toDto(r));
  }

  async findOne(id: string): Promise<ReviewResponseDto> {
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException(`Avis ${id} introuvable.`);
    return this.toDto(review);
  }

  // ─── SIGNALEMENT ──────────────────────────────────────────────────────────

  async report(
    id: string,
    dto: ReportReviewDto,
    requesterId: string,
  ): Promise<ReviewResponseDto> {
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException(`Avis ${id} introuvable.`);

    // Seule la cible peut signaler un avis la concernant
    if (review.targetId !== requesterId) {
      throw new ForbiddenException(
        'Vous ne pouvez signaler que les avis vous concernant.',
      );
    }

    if (review.isReported) {
      throw new ConflictException('Cet avis a déjà été signalé.');
    }

    review.isReported   = true;
    review.reportReason = dto.reason;
    const saved = await this.reviewRepo.save(review);

    this.logger.warn(`Avis signalé : ${id} — raison : ${dto.reason}`);
    return this.toDto(saved);
  }

  // ─── ADMIN ────────────────────────────────────────────────────────────────

  async remove(id: string): Promise<void> {
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException(`Avis ${id} introuvable.`);

    const { targetId } = review;
    await this.reviewRepo.remove(review);

    // Recalcule la note sans cet avis
    await this.usersService.updateAverageRating(targetId);
    this.logger.warn(`Avis supprimé par admin : ${id}`);
  }

  async findReported(): Promise<ReviewResponseDto[]> {
    const reviews = await this.reviewRepo.find({
      where: { isReported: true },
      order: { createdAt: 'DESC' },
    });
    return reviews.map((r) => this.toDto(r));
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  private toDto(review: Review): ReviewResponseDto {
    return plainToInstance(ReviewResponseDto, review, {
      excludeExtraneousValues: true,
    });
  }
}

function rating(n: number): string {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}