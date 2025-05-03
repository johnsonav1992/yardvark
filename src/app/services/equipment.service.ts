import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { apiUrl, postReq, putReq } from '../utils/httpUtils';
import { Equipment, EquipmentMaintenance } from '../types/equipment.types';

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  public equipment = httpResource<Equipment[]>(apiUrl('equipment'));

  public addMaintenanceRecord(
    equipmentId: number,
    recordData: Partial<EquipmentMaintenance>
  ) {
    return postReq(apiUrl(`equipment/${equipmentId}/maintenance`), recordData);
  }

  public updateMaintenanceRecord(
    maintenanceId: number,
    newData: Partial<EquipmentMaintenance>
  ) {
    return putReq(apiUrl(`equipment/maintenance/${maintenanceId}`), newData);
  }
}
