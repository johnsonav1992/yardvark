import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Equipment } from '../models/equipment.model';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EquipmentMaintenance } from '../models/equipmentMaintenance.model';

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

  async toggleEquipmentArchiveStatus(
    equipmentId: number,
    isActive: boolean,
  ): Promise<void> {
    const equipment = await this.findEquipmentById(equipmentId);

    if (!equipment) {
      throw new HttpException('Equipment not found', HttpStatus.NOT_FOUND);
    }

    equipment.isActive = isActive;

    await this._equipmentRepo.save(equipment);
  }

  async createMaintenanceRecord(
    equipmentId: number,
    maintenanceData: Partial<EquipmentMaintenance>,
  ): Promise<EquipmentMaintenance> {
    const equipment = await this.findEquipmentById(equipmentId);

    if (!equipment) {
      throw new HttpException('Equipment not found', HttpStatus.NOT_FOUND);
    }

    const newMaintenanceRecord = this._equipmentMaintenanceRepo.create({
      ...maintenanceData,
      equipment: {
        id: equipmentId,
      },
    });

    await this._equipmentMaintenanceRepo.save(newMaintenanceRecord);

    return newMaintenanceRecord;
  }

  async updateMaintenanceRecord(
    maintenanceId: number,
    maintenanceData: Partial<EquipmentMaintenance>,
  ): Promise<EquipmentMaintenance> {
    const maintenanceRecord = await this._equipmentMaintenanceRepo.findOne({
      where: { id: maintenanceId },
    });

    if (!maintenanceRecord) {
      throw new HttpException(
        'Maintenance record not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const updated: EquipmentMaintenance = {
      ...maintenanceRecord,
      ...maintenanceData,
      updatedAt: new Date(),
    };

    return this._equipmentMaintenanceRepo.save(updated);
  }

  async deleteMaintenanceRecord(maintenanceId: number): Promise<void> {
    const maintenanceRecord = await this._equipmentMaintenanceRepo.findOne({
      where: { id: maintenanceId },
    });

    if (!maintenanceRecord) {
      throw new HttpException(
        'Maintenance record not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this._equipmentMaintenanceRepo.softDelete(maintenanceId);
  }

  private async findEquipmentById(
    equipmentId: number,
  ): Promise<Equipment | null> {
    return this._equipmentRepo.findOne({
      where: { id: equipmentId },
    });
  }
}
