import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

import { BookingsModule } from '../bookings/bookings.module';
import { UsersModule } from '../users/users.module';
import { Review } from './entities/reviews.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review]),
    BookingsModule, 
    UsersModule,   
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}