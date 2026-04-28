import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Vehicle } from './entities/vehicule.entity';
import { CloudinaryModule } from '../common/cloudinary/cloudinary.module';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle]),
    CloudinaryModule,
  ],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}