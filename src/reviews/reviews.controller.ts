import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseUUIDPipe,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiParam,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReportReviewDto } from './dto/report-review.dto';
import { ReviewResponseDto, UserRatingSummaryDto } from './dto/review-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiAuthRequired } from '../auth/decorators/api-auth.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@ApiTags('reviews')
@ApiAuthRequired()
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Laisser un avis après un trajet terminé' })
  @ApiResponse({ status: 201, type: ReviewResponseDto })
  @ApiResponse({ status: 400, description: 'Trajet non terminé' })
  @ApiResponse({ status: 409, description: 'Avis déjà laissé' })
  create(
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: User,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.create(dto, user.id);
  }

  @Public()
  @Get('user/:userId')
  @ApiOperation({ summary: 'Avis reçus par un utilisateur (public)' })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({ status: 200, type: UserRatingSummaryDto })
  findByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<UserRatingSummaryDto> {
    return this.reviewsService.findByUser(userId);
  }

  @Get('booking/:bookingId')
  @ApiOperation({ summary: 'Avis d\'une réservation (participants uniquement)' })
  @ApiParam({ name: 'bookingId', type: String })
  @ApiResponse({ status: 200, type: [ReviewResponseDto] })
  findByBooking(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @CurrentUser() user: User,
  ): Promise<ReviewResponseDto[]> {
    return this.reviewsService.findByBooking(bookingId, user.id);
  }

  @Get('reported')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Lister les avis signalés' })
  @ApiResponse({ status: 200, type: [ReviewResponseDto] })
  findReported(): Promise<ReviewResponseDto[]> {
    return this.reviewsService.findReported();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un avis (public)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: ReviewResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id/report')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Signaler un avis abusif (cible uniquement)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: ReviewResponseDto })
  report(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReportReviewDto,
    @CurrentUser() user: User,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.report(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Supprimer un avis signalé' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204 })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.reviewsService.remove(id);
  }
}