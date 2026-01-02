import { httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { apiUrl } from '../utils/httpUtils';
import { AnalyticsRes } from '../types/analytics.types';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  public year = signal(new Date().getFullYear());

  public analyticsData = httpResource<AnalyticsRes>(() =>
    apiUrl('analytics', { queryParams: { year: this.year() } })
  );
}
