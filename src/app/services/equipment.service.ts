import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { apiUrl, putReq } from '../utils/httpUtils';
import { Equipment, EquipmentMaintenance } from '../types/equipment.types';

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  public equipment = httpResource<Equipment[]>(apiUrl('equipment'));

  public updateMaintenanceRecord(
    maintenanceId: number,
    newData: Partial<EquipmentMaintenance>
  ) {
    return putReq(apiUrl(`equipment/maintenance/${maintenanceId}`), newData);
  }
}
