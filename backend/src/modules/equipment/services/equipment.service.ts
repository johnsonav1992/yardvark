import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Repository } from "typeorm";
import { LogHelpers } from "../../../logger/logger.helpers";
import { BusinessContextKeys } from "../../../logger/logger-keys.constants";
import { type Either, error, success } from "../../../types/either";
import {
	EquipmentNotFound,
	MaintenanceRecordNotFound,
} from "../models/equipment.errors";
import { Equipment } from "../models/equipment.model";
import { EquipmentMaintenance } from "../models/equipmentMaintenance.model";

@Injectable()
export class EquipmentService {
	constructor(
		@InjectRepository(Equipment)
		private readonly _equipmentRepo: Repository<Equipment>,
		@InjectRepository(EquipmentMaintenance)
		private readonly _equipmentMaintenanceRepo: Repository<EquipmentMaintenance>,
	) {}

	public async getAllUserEquipment(userId: string): Promise<Equipment[]> {
		const equipment = await this._equipmentRepo.find({
			where: { userId },
			relations: { maintenanceRecords: true },
			order: {
				maintenanceRecords: {
					maintenanceDate: "DESC",
				},
			},
		});

		LogHelpers.addBusinessContext(
			BusinessContextKeys.equipmentCount,
			equipment.length,
		);

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

		const saved = await this._equipmentRepo.save(newEquipment);

		LogHelpers.addBusinessContext(
			BusinessContextKeys.equipmentCreated,
			saved.id,
		);

		return saved;
	}

	public async updateEquipment(
		equipmentId: number,
		equipmentData: Partial<Equipment>,
	): Promise<Either<EquipmentNotFound, Equipment>> {
		const equipment = await this.findEquipmentById(equipmentId);

		if (!equipment) {
			return error(new EquipmentNotFound());
		}

		const updatedEquipment = {
			...equipment,
			...equipmentData,
			updatedAt: new Date(),
		};

		return success(await this._equipmentRepo.save(updatedEquipment));
	}

	public async toggleEquipmentArchiveStatus(
		equipmentId: number,
		isActive: boolean,
	): Promise<Either<EquipmentNotFound, void>> {
		const equipment = await this.findEquipmentById(equipmentId);

		if (!equipment) {
			return error(new EquipmentNotFound());
		}

		equipment.isActive = isActive;

		await this._equipmentRepo.save(equipment);

		return success(undefined);
	}

	public async createMaintenanceRecord(
		equipmentId: number,
		maintenanceData: Partial<EquipmentMaintenance>,
	): Promise<Either<EquipmentNotFound, EquipmentMaintenance>> {
		LogHelpers.addBusinessContext(BusinessContextKeys.equipmentId, equipmentId);

		const equipment = await this.findEquipmentById(equipmentId);

		if (!equipment) {
			return error(new EquipmentNotFound());
		}

		const newMaintenanceRecord = this._equipmentMaintenanceRepo.create({
			...maintenanceData,
			equipment: {
				id: equipmentId,
			},
		});

		await this._equipmentMaintenanceRepo.save(newMaintenanceRecord);

		LogHelpers.addBusinessContext(
			BusinessContextKeys.maintenanceRecordCreated,
			newMaintenanceRecord.id,
		);

		return success(newMaintenanceRecord);
	}

	public async updateMaintenanceRecord(
		maintenanceId: number,
		maintenanceData: Partial<EquipmentMaintenance>,
	): Promise<Either<MaintenanceRecordNotFound, EquipmentMaintenance>> {
		const maintenanceRecord = await this._equipmentMaintenanceRepo.findOne({
			where: { id: maintenanceId },
		});

		if (!maintenanceRecord) {
			return error(new MaintenanceRecordNotFound());
		}

		const updated: EquipmentMaintenance = {
			...maintenanceRecord,
			...maintenanceData,
			updatedAt: new Date(),
		};

		return success(await this._equipmentMaintenanceRepo.save(updated));
	}

	public async deleteEquipment(
		equipmentId: number,
	): Promise<Either<EquipmentNotFound, void>> {
		LogHelpers.addBusinessContext(BusinessContextKeys.equipmentId, equipmentId);

		const equipment = await this.findEquipmentById(equipmentId);

		if (!equipment) {
			return error(new EquipmentNotFound());
		}

		await this._equipmentRepo.softDelete(equipmentId);

		LogHelpers.addBusinessContext(BusinessContextKeys.equipmentDeleted, true);

		return success(undefined);
	}

	public async deleteMaintenanceRecord(
		maintenanceId: number,
	): Promise<Either<MaintenanceRecordNotFound, void>> {
		const maintenanceRecord = await this._equipmentMaintenanceRepo.findOne({
			where: { id: maintenanceId },
		});

		if (!maintenanceRecord) {
			return error(new MaintenanceRecordNotFound());
		}

		await this._equipmentMaintenanceRepo.softDelete(maintenanceId);

		return success(undefined);
	}

	private async findEquipmentById(
		equipmentId: number,
	): Promise<Equipment | null> {
		return this._equipmentRepo.findOne({
			where: { id: equipmentId },
		});
	}
}
