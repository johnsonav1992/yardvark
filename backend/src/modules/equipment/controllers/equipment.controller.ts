import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
	Query,
	UploadedFile,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { S3Service } from "src/modules/s3/s3.service";
import { imageFileValidator } from "src/utils/fileUtils";
import { User } from "../../../decorators/user.decorator";
import { LogHelpers } from "../../../logger/logger.helpers";
import { BusinessContextKeys } from "../../../logger/logger-keys.constants";
import { resultOrThrow } from "../../../utils/resultOrThrow";
import type { Equipment } from "../models/equipment.model";
import type { EquipmentMaintenance } from "../models/equipmentMaintenance.model";
import { EquipmentService } from "../services/equipment.service";

@Controller("equipment")
export class EquipmentController {
	constructor(
		private readonly _equipmentService: EquipmentService,
		private readonly _s3Service: S3Service,
	) {}

	@Get()
	public getAllUserEquipment(@User("userId") userId: string) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"get_all_equipment",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

		return this._equipmentService.getAllUserEquipment(userId);
	}

	@Post()
	@UseInterceptors(FileInterceptor("equipment-image"))
	public async createEquipment(
		@User("userId") userId: string,
		@UploadedFile(imageFileValidator()) file: Express.Multer.File,
		@Body() equipmentData: Partial<Equipment>,
	) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"create_equipment",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

		let imageUrl: string | undefined;

		if (file) {
			imageUrl = resultOrThrow(await this._s3Service.uploadFile(file, userId));
		}

		return this._equipmentService.createEquipment(userId, {
			...equipmentData,
			imageUrl,
		});
	}

	@Put(":equipmentId")
	@UseInterceptors(FileInterceptor("equipment-image"))
	public async updateEquipment(
		@User("userId") userId: string,
		@Param("equipmentId") equipmentId: number,
		@UploadedFile(imageFileValidator()) file: Express.Multer.File,
		@Body() equipmentData: Partial<Equipment>,
	) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"update_equipment",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);
		LogHelpers.addBusinessContext(BusinessContextKeys.equipmentId, equipmentId);

		let imageUrl: string | undefined;

		if (file) {
			imageUrl = resultOrThrow(await this._s3Service.uploadFile(file, userId));
		}

		const result = await this._equipmentService.updateEquipment(equipmentId, {
			...equipmentData,
			imageUrl,
		});

		return resultOrThrow(result);
	}

	@Put(":equipmentId/archive-status")
	public async toggleEquipmentArchiveStatus(
		@Param("equipmentId") equipmentId: number,
		@Query("isActive") isActive: boolean,
	) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"toggle_archive_status",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.equipmentId, equipmentId);
		LogHelpers.addBusinessContext(BusinessContextKeys.isActive, isActive);

		const result = await this._equipmentService.toggleEquipmentArchiveStatus(
			equipmentId,
			isActive,
		);

		return resultOrThrow(result);
	}

	@Post(":equipmentId/maintenance")
	public async createMaintenanceRecord(
		@Param("equipmentId") equipmentId: number,
		@Body() maintenanceData: Partial<EquipmentMaintenance>,
	) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"create_maintenance_record",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.equipmentId, equipmentId);

		const result = await this._equipmentService.createMaintenanceRecord(
			equipmentId,
			maintenanceData,
		);

		return resultOrThrow(result);
	}

	@Put("maintenance/:maintenanceId")
	public async updateMaintenanceRecord(
		@Param("maintenanceId") maintenanceId: number,
		@Body() maintenanceData: Partial<EquipmentMaintenance>,
	) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"update_maintenance_record",
		);
		LogHelpers.addBusinessContext(
			BusinessContextKeys.maintenanceId,
			maintenanceId,
		);

		const result = await this._equipmentService.updateMaintenanceRecord(
			maintenanceId,
			maintenanceData,
		);

		return resultOrThrow(result);
	}

	@Delete(":equipmentId")
	public async deleteEquipment(@Param("equipmentId") equipmentId: number) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"delete_equipment",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.equipmentId, equipmentId);

		const result = await this._equipmentService.deleteEquipment(equipmentId);

		return resultOrThrow(result);
	}

	@Delete("maintenance/:maintenanceId")
	public async deleteMaintenanceRecord(
		@Param("maintenanceId") maintenanceId: number,
	) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"delete_maintenance_record",
		);
		LogHelpers.addBusinessContext(
			BusinessContextKeys.maintenanceId,
			maintenanceId,
		);

		const result =
			await this._equipmentService.deleteMaintenanceRecord(maintenanceId);

		return resultOrThrow(result);
	}
}
