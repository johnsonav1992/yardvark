import { Injectable } from '@angular/core';
import { injectUserData } from '../utils/authUtils';
import { httpResource } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ActivitiesService {
  public user = injectUserData();

  public activities = httpResource('');
}
