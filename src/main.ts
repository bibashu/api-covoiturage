import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  app.enableCors();
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('Covoiturage API')
    .setDescription('API REST de l\'application de covoiturage')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentification')
    .addTag('users', 'Utilisateurs')
    .addTag('trips', 'Trajets')
    .addTag('vehicules', 'Vehicules')
    .addTag('bookings', 'Réservations')
    .addTag('payments', 'Paiements')
    .addTag('reviews', 'Avis')
    .addTag('messages', 'Messagerie')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);

}
bootstrap();