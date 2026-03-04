import { ResourceNotFound } from "../../../errors/resource-error";

export class EquipmentNotFound extends ResourceNotFound {
	constructor() {
		super({
			message: "Equipment not found",
			code: "EQUIPMENT_NOT_FOUND",
		});
	}
}

export class MaintenanceRecordNotFound extends ResourceNotFound {
	constructor() {
		super({
			message: "Maintenance record not found",
			code: "MAINTENANCE_RECORD_NOT_FOUND",
		});
	}
}
