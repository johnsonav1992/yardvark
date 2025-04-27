import { Module } from '@nestjs/common';
import { EquipmentController } from './controllers/equipment.controller';
import { EquipmentService } from './services/equipment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Equipment } from './models/equipment.model';
import { EquipmentMaintenance } from './models/equipmentMaintainence.model';

@Module({
  imports: [TypeOrmModule.forFeature([Equipment, EquipmentMaintenance])],
  controllers: [EquipmentController],
  providers: [EquipmentService],
})
export class EquipmentModule {}
