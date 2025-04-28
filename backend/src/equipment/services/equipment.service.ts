import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Equipment } from '../models/equipment.model';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EquipmentMaintenance } from '../models/equipmentMaintainence.model';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment)
    private readonly _equipmentRepo: Repository<Equipment>,
    @InjectRepository(EquipmentMaintenance)
    private readonly _equipmentMaintenanceRepo: Repository<EquipmentMaintenance>,
  ) {}

  async getAllUserEquipment(userId: string): Promise<Equipment[]> {
    return this._equipmentRepo.find({
      where: { userId },
      relations: { maintenanceRecords: true },
    });
  }

  async createEquipment(
    userId: string,
    equipmentData: Partial<Equipment>,
  ): Promise<Equipment> {
    const newEquipment = this._equipmentRepo.create({
      ...equipmentData,
      maintenanceRecords: [],
      userId,
    });

    return this._equipmentRepo.save(newEquipment);
  }

  async createMaintenanceRecord(
    equipmentId: number,
    maintenanceData: Partial<EquipmentMaintenance>,
  ) {
    const equipment = await this._equipmentRepo.findOne({
      where: { id: equipmentId },
      relations: { maintenanceRecords: true },
    });

    if (!equipment) {
      throw new HttpException('Equipment not found', HttpStatus.NOT_FOUND);
    }

    const newMaintenanceRecord = this._equipmentMaintenanceRepo.create({
      equipment,
      ...maintenanceData,
    });

    equipment.maintenanceRecords.push(newMaintenanceRecord);

    await this._equipmentRepo.save(equipment);

    return newMaintenanceRecord;
  }
}
