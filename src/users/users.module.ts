import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CloudinaryModule } from '../common/cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    CloudinaryModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
