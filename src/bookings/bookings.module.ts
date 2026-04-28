import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking } from './entities/bookings.entity';
import { TripsModule } from '../trips/trips.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    TripsModule,   // Pour accéder à TripsService (places, statuts)
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}