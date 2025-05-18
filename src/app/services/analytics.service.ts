import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { apiUrl } from '../utils/httpUtils';
import { AnalyticsRes } from '../types/analytics.types';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  public analyticsData = httpResource<AnalyticsRes>(apiUrl('analytics'));
}
