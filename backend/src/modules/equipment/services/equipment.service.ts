import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Equipment } from '../models/equipment.model';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EquipmentMaintenance } from '../models/equipmentMaintenance.model';
import { LogHelpers } from '../../../logger/logger.helpers';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment)
    private readonly _equipmentRepo: Repository<Equipment>,
    @InjectRepository(EquipmentMaintenance)
    private readonly _equipmentMaintenanceRepo: Repository<EquipmentMaintenance>,
  ) {}

  public async getAllUserEquipment(userId: string): Promise<Equipment[]> {
    const equipment = await LogHelpers.withDatabaseTelemetry(() =>
      this._equipmentRepo.find({
        where: { userId },
        relations: { maintenanceRecords: true },
        order: {
          maintenanceRecords: {
            maintenanceDate: 'DESC',
          },
        },
      }),
    );

    LogHelpers.addBusinessContext('equipmentCount', equipment.length);

    return equipment;
  }

  public async createEquipment(
    userId: string,
    equipmentData: Partial<Equipment>,
  ): Promise<Equipment> {
    const newEquipment = this._equipmentRepo.create({
      ...equipmentData,
      maintenanceRecords: [],
      userId,
    });

    const saved = await LogHelpers.withDatabaseTelemetry(() =>
      this._equipmentRepo.save(newEquipment),
    );

    LogHelpers.addBusinessContext('equipmentCreated', saved.id);

    return saved;
  }

  public async updateEquipment(
    equipmentId: number,
    equipmentData: Partial<Equipment>,
  ): Promise<Equipment> {
    const equipment = await this.findEquipmentById(equipmentId);

    if (!equipment) {
      throw new HttpException('Equipment not found', HttpStatus.NOT_FOUND);
    }

    const updatedEquipment = {
      ...equipment,
      ...equipmentData,
      updatedAt: new Date(),
    };

    return this._equipmentRepo.save(updatedEquipment);
  }

  public async toggleEquipmentArchiveStatus(
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

  public async createMaintenanceRecord(
    equipmentId: number,
    maintenanceData: Partial<EquipmentMaintenance>,
  ): Promise<EquipmentMaintenance> {
    LogHelpers.addBusinessContext('equipmentId', equipmentId);

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

    await LogHelpers.withDatabaseTelemetry(() =>
      this._equipmentMaintenanceRepo.save(newMaintenanceRecord),
    );

    LogHelpers.addBusinessContext(
      'maintenanceRecordCreated',
      newMaintenanceRecord.id,
    );

    return newMaintenanceRecord;
  }

  public async updateMaintenanceRecord(
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

  public async deleteEquipment(equipmentId: number): Promise<void> {
    LogHelpers.addBusinessContext('equipmentId', equipmentId);

    const equipment = await this.findEquipmentById(equipmentId);

    if (!equipment) {
      throw new HttpException('Equipment not found', HttpStatus.NOT_FOUND);
    }

    await LogHelpers.withDatabaseTelemetry(() =>
      this._equipmentRepo.softDelete(equipmentId),
    );

    LogHelpers.addBusinessContext('equipmentDeleted', true);
  }

  public async deleteMaintenanceRecord(maintenanceId: number): Promise<void> {
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
