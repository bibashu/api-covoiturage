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
     
        return {
          type: 'postgres',

          host: configService.get('DB_HOST'),
          port: parseInt(configService.get('DB_PORT') ?? '5432'),
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_NAME'),

          entities: [User, Vehicle, Trip, Booking, Payment, Review, Message, TripStop, Notification],

          synchronize: configService.get('NODE_ENV') !== 'production',
          logging: configService.get('NODE_ENV') === 'development',
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
