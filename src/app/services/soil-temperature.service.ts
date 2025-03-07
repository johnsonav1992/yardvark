import { computed, Injectable, signal } from '@angular/core';
import { LatLong } from '../types/types';
import { Observable } from 'rxjs';
import { httpResource } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { formatDate } from '@angular/common';
import {
  DailySoilTemperatureResponse,
  OpenMeteoQueryParams
} from '../types/openmeteo.types';
import { getRollingWeekStartAndEndDates } from '../utils/timeUtils';

@Injectable({
  providedIn: 'root'
})
export class SoilTemperatureService {
  private readonly _baseUrl = 'https://api.open-meteo.com/v1/forecast';
  private readonly _sharedQueryParams = computed<Partial<OpenMeteoQueryParams>>(
    () => ({
      hourly: ['soil_temperature_6cm', 'soil_temperature_18cm'],
      temperature_unit: this.temperatureUnit()!,
      timezone: 'auto'
    })
  );

  public temperatureUnit =
    signal<OpenMeteoQueryParams['temperature_unit']>('fahrenheit');
  public startDate = signal<Date | null>(null);
  public endDate = signal<Date | null>(null);

  public past24HourSoilTemperatureData =
    httpResource<DailySoilTemperatureResponse>(() => {
      const coords = this._currentLatLong?.value();
      const now = new Date();
      const endHour = formatDate(now, 'YYYY-MM-ddTHH:00', 'en-US')!;
      const startHour = formatDate(
        new Date(now.getTime() - 24 * 60 * 60 * 1000),
        'YYYY-MM-ddTHH:00',
        'en-US'
      )!;

      return coords
        ? {
            url: this._baseUrl,
            params: {
              ...this._sharedQueryParams(),
              latitude: coords.lat,
              longitude: coords.long,
              start_hour: startHour,
              end_hour: endHour
            } satisfies OpenMeteoQueryParams
          }
        : undefined;
    });

  public rollingWeekDailyAverageSoilData =
    httpResource<DailySoilTemperatureResponse>(() => {
      const coords = this._currentLatLong?.value();
      const { startDate, endDate } = getRollingWeekStartAndEndDates();

      return coords && startDate && endDate
        ? {
            url: this._baseUrl,
            params: {
              ...this._sharedQueryParams(),
              hourly: [
                ...this._sharedQueryParams().hourly!,
                'soil_moisture_3_to_9cm'
              ],
              latitude: coords.lat,
              longitude: coords.long,
              start_date: formatDate(startDate, 'YYYY-MM-dd', 'en-US'),
              end_date: formatDate(endDate, 'YYYY-MM-dd', 'en-US')
            } satisfies OpenMeteoQueryParams
          }
        : undefined;
    });

  private _currentLatLong = rxResource({
    loader: () => this.getCurrentLatLong()
  });

  private getCurrentLatLong(): Observable<LatLong | null> {
    return new Observable((observer) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          observer.next({
            lat: position.coords.latitude,
            long: position.coords.longitude
          });

          observer.complete();
        },
        (error) => {
          observer.error(`Error fetching user location: ${error}`);
        }
      );
    });
  }
}
