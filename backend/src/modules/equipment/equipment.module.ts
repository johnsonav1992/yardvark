import { Module } from '@nestjs/common';
import { EquipmentController } from './controllers/equipment.controller';
import { EquipmentService } from './services/equipment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Equipment } from './models/equipment.model';
import { EquipmentMaintenance } from './models/equipmentMaintenance.model';
import { S3Service } from 'src/modules/s3/s3.service';
import { ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([Equipment, EquipmentMaintenance]),
    HttpModule,
  ],
  controllers: [EquipmentController],
  providers: [EquipmentService, S3Service, ConfigService],
})
export class EquipmentModule {}
