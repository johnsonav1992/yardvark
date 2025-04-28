import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { apiUrl } from '../utils/httpUtils';
import { Equipment } from '../types/equipment.types';

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  public equipment = httpResource<Equipment[]>(apiUrl('equipment'));
}
