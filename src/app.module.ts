import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TripsModule } from './trips/trips.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { MessagesModule } from './messages/messages.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReviewsModule } from './reviews/reviews.module';
import { User } from './users/entities/user.entity';
import { Vehicle } from './vehicles/entities/vehicule.entity';
import { Trip } from './trips/entities/trips.entity';
import { Booking } from './bookings/entities/bookings.entity';
import { Message } from './messages/entities/message.entity';
import { Review } from './reviews/entities/reviews.entity';
import { Payment } from './payments/entities/payments.entity';
import { TripStop } from './trips/entities/trip-stop.entity';
import { Notification } from './notifications/entities/notification.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('DATABASE_URL');

        return {
          type: 'postgres',
          url: dbUrl,

          entities: [
            User,
            Vehicle,
            Trip,
            Booking,
            Payment,
            Review,
            Message,
            TripStop,
            Notification,
          ],

          synchronize: true, // NE PAS UTILISER EN PRODUCTION
         logging: process.env.NODE_ENV !== 'production',
          ssl: {
            rejectUnauthorized: false, 
          },
        };
      },
    }),
    CacheModule.register({ isGlobal: true }),
    AuthModule,
    UsersModule,
    TripsModule,
    BookingsModule,
    PaymentsModule,
    MessagesModule,
    VehiclesModule,
    MessagesModule,
    NotificationsModule,
    ReviewsModule,
    TripStop,
  ],
})
export class AppModule {}
