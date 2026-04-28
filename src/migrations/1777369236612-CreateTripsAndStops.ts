import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTripsAndStops1777369236612 implements MigrationInterface {
    name = 'CreateTripsAndStops1777369236612'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('driver', 'passenger', 'both', 'admin')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firstName" character varying(100) NOT NULL, "lastName" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying NOT NULL, "phone" character varying(20), "photoUrl" character varying, "photoPublicId" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'both', "averageRating" numeric(3,2) NOT NULL DEFAULT '0', "totalRatings" integer NOT NULL DEFAULT '0', "isVerified" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "refreshToken" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "vehicles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ownerId" uuid NOT NULL, "brand" character varying(100) NOT NULL, "model" character varying(100) NOT NULL, "year" integer NOT NULL, "color" character varying(50) NOT NULL, "licensePlate" character varying(20) NOT NULL, "seats" integer NOT NULL, "photoUrl" character varying, "photoPublicId" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_79a273823977d25c7523162cd5a" UNIQUE ("licensePlate"), CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."bookings_status_enum" AS ENUM('pending', 'confirmed', 'rejected', 'cancelled_by_passenger', 'cancelled_by_driver', 'completed')`);
        await queryRunner.query(`CREATE TABLE "bookings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "passengerId" uuid NOT NULL, "tripId" uuid NOT NULL, "seatsBooked" integer NOT NULL DEFAULT '1', "totalAmount" numeric(10,2) NOT NULL, "status" "public"."bookings_status_enum" NOT NULL DEFAULT 'pending', "passengerNote" text, "cancellationReason" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bee6805982cc1e248e94ce94957" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "trip_stops" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tripId" uuid NOT NULL, "city" character varying(100) NOT NULL, "address" character varying, "latitude" numeric(10,7) NOT NULL, "longitude" numeric(10,7) NOT NULL, "order" integer NOT NULL, "estimatedTime" TIMESTAMP WITH TIME ZONE, "priceFromDeparture" numeric(10,2), CONSTRAINT "PK_876633f878970267cb0dc525984" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."trips_status_enum" AS ENUM('draft', 'published', 'full', 'in_progress', 'completed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "trips" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "driverId" uuid NOT NULL, "vehicleId" uuid NOT NULL, "departureCity" character varying(100) NOT NULL, "arrivalCity" character varying(100) NOT NULL, "departureAddress" character varying, "arrivalAddress" character varying, "departureLat" numeric(10,7) NOT NULL, "departureLon" numeric(10,7) NOT NULL, "arrivalLat" numeric(10,7) NOT NULL, "arrivalLon" numeric(10,7) NOT NULL, "departureTime" TIMESTAMP WITH TIME ZONE NOT NULL, "estimatedArrivalTime" TIMESTAMP WITH TIME ZONE, "availableSeats" integer NOT NULL, "pricePerSeat" numeric(10,2) NOT NULL, "status" "public"."trips_status_enum" NOT NULL DEFAULT 'published', "smokingAllowed" boolean NOT NULL DEFAULT false, "petsAllowed" boolean NOT NULL DEFAULT false, "musicAllowed" boolean NOT NULL DEFAULT false, "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f71c231dee9c05a9522f9e840f5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."reviews_targettype_enum" AS ENUM('driver', 'passenger')`);
        await queryRunner.query(`CREATE TABLE "reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bookingId" uuid NOT NULL, "authorId" uuid NOT NULL, "targetId" uuid NOT NULL, "targetType" "public"."reviews_targettype_enum" NOT NULL, "rating" integer NOT NULL, "comment" text, "isReported" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "CHK_e87bbcfbe3ea0dda3d626010ee" CHECK ("rating" >= 1 AND "rating" <= 5), CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."payments_method_enum" AS ENUM('card', 'mobile_money', 'wallet')`);
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('pending', 'authorized', 'captured', 'refunded', 'failed')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bookingId" uuid NOT NULL, "payerId" uuid NOT NULL, "amount" numeric(10,2) NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'XOF', "method" "public"."payments_method_enum" NOT NULL, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'pending', "stripePaymentIntentId" character varying, "stripeChargeId" character varying, "failureReason" character varying, "capturedAt" TIMESTAMP WITH TIME ZONE, "refundedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_1ead3dc5d71db0ea822706e389" UNIQUE ("bookingId"), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bookingId" uuid NOT NULL, "senderId" uuid NOT NULL, "content" text NOT NULL, "isRead" boolean NOT NULL DEFAULT false, "readAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_c0a0d32b2ae04801d6e5b9e5c80" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_4ddbabffcf7921575886059d5c0" FOREIGN KEY ("passengerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_e33f0b046a54956d011b3d377ef" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trip_stops" ADD CONSTRAINT "FK_37cc2e3103d3ad66b08b7ba220d" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trips" ADD CONSTRAINT "FK_fc5a8911f85074a660a4304baa1" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trips" ADD CONSTRAINT "FK_d3cea80b69fc4ecfd2273068395" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_c357057587a1c2afae453515bf6" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_48770372f891b9998360e4434f3" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_4a73980338b57f2c9178d8aaeb9" FOREIGN KEY ("targetId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_1ead3dc5d71db0ea822706e389d" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_ff40a657baa9226eb63c6c01dd3" FOREIGN KEY ("payerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_28af6a779af00bcc34817ec0f84" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_28af6a779af00bcc34817ec0f84"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_ff40a657baa9226eb63c6c01dd3"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_1ead3dc5d71db0ea822706e389d"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_4a73980338b57f2c9178d8aaeb9"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_48770372f891b9998360e4434f3"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_c357057587a1c2afae453515bf6"`);
        await queryRunner.query(`ALTER TABLE "trips" DROP CONSTRAINT "FK_d3cea80b69fc4ecfd2273068395"`);
        await queryRunner.query(`ALTER TABLE "trips" DROP CONSTRAINT "FK_fc5a8911f85074a660a4304baa1"`);
        await queryRunner.query(`ALTER TABLE "trip_stops" DROP CONSTRAINT "FK_37cc2e3103d3ad66b08b7ba220d"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_e33f0b046a54956d011b3d377ef"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_4ddbabffcf7921575886059d5c0"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_c0a0d32b2ae04801d6e5b9e5c80"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payments_method_enum"`);
        await queryRunner.query(`DROP TABLE "reviews"`);
        await queryRunner.query(`DROP TYPE "public"."reviews_targettype_enum"`);
        await queryRunner.query(`DROP TABLE "trips"`);
        await queryRunner.query(`DROP TYPE "public"."trips_status_enum"`);
        await queryRunner.query(`DROP TABLE "trip_stops"`);
        await queryRunner.query(`DROP TABLE "bookings"`);
        await queryRunner.query(`DROP TYPE "public"."bookings_status_enum"`);
        await queryRunner.query(`DROP TABLE "vehicles"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
