import { Injectable } from '@nestjs/common';
import { Equipment } from '../models/equipment.model';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment)
    private readonly _equipmentRepo: Repository<Equipment>,
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
}
