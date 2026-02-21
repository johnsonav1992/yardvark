import { httpResource } from "@angular/common/http";
import { Injectable } from "@angular/core";
import type {
	Equipment,
	EquipmentFormData,
	EquipmentMaintenance,
} from "../types/equipment.types";
import { apiUrl, deleteReq, postReq, putReq } from "../utils/httpUtils";

@Injectable({
	providedIn: "root",
})
export class EquipmentService {
	public equipment = httpResource<Equipment[]>(() => apiUrl("equipment"));

	public createEquipment(equipmentData: EquipmentFormData) {
		const formData = this.buildEquipmentFormData(equipmentData);

		return postReq(apiUrl("equipment"), formData);
	}

	public updateEquipment(
		equipmentId: number,
		equipmentData: EquipmentFormData | Partial<Equipment>,
	) {
		if (
			equipmentData instanceof FormData ||
			this.isEquipmentFormData(equipmentData)
		) {
			const formData = this.buildEquipmentFormData(
				equipmentData as EquipmentFormData,
			);
			return putReq(apiUrl(`equipment/${equipmentId}`), formData);
		}

		return putReq(apiUrl(`equipment/${equipmentId}`), equipmentData);
	}

	private isEquipmentFormData(data: any): data is EquipmentFormData {
		return data && ("name" in data || "brand" in data || "image" in data);
	}

	public addMaintenanceRecord(
		equipmentId: number,
		recordData: Partial<EquipmentMaintenance>,
	) {
		return postReq(apiUrl(`equipment/${equipmentId}/maintenance`), recordData);
	}

	public updateMaintenanceRecord(
		maintenanceId: number,
		newData: Partial<EquipmentMaintenance>,
	) {
		return putReq(apiUrl(`equipment/maintenance/${maintenanceId}`), newData);
	}

	public deleteEquipment(equipmentId: number) {
		return deleteReq(apiUrl(`equipment/${equipmentId}`));
	}

	public deleteMaintenanceRecord(maintenanceId: number) {
		return deleteReq(apiUrl(`equipment/maintenance/${maintenanceId}`));
	}

	private buildEquipmentFormData(equipmentData: EquipmentFormData): FormData {
		const formData = new FormData();

		if (equipmentData && typeof equipmentData === "object") {
			Object.entries(equipmentData).forEach(([key, value]) => {
				if (value instanceof File) {
					formData.append("equipment-image", value);
				} else if (value) {
					formData.append(key, String(value));
				}
			});
		}

		return formData;
	}
}
