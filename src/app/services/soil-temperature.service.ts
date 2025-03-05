import { Injectable, signal } from '@angular/core';
import { LatLong } from '../types/types';
import { Observable } from 'rxjs';
import { httpResource } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { formatDate } from '@angular/common';
import {
  DailySoilTemperatureResponse,
  OpenMeteoQueryParams,
} from '../types/openmeteo.types';

@Injectable({
  providedIn: 'root',
})
export class SoilTemperatureService {
  private readonly _baseUrl = 'https://api.open-meteo.com/v1/forecast';

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
        'en-US',
      )!;

      return coords
        ? {
            url: this._baseUrl,
            params: {
              latitude: coords.lat,
              longitude: coords.long,
              hourly: ['soil_temperature_6cm', 'soil_temperature_18cm'],
              temperature_unit: this.temperatureUnit()!,
              timezone: 'auto',
              start_hour: startHour,
              end_hour: endHour,
            } satisfies OpenMeteoQueryParams,
          }
        : undefined;
    });

  public weeklySoilTemperatureData = httpResource(() => {
    const coords = this._currentLatLong?.value();
    const start = this.startDate();
    const end = this.endDate();

    return coords && start && end
      ? {
          url: this._baseUrl,
          params: {
            latitude: coords.lat,
            longitude: coords.long,
            hourly: ['soil_temperature_6cm', 'soil_temperature_18cm'],
            temperature_unit: this.temperatureUnit()!,
            timezone: 'auto',
            start_date: formatDate(start, 'YYYY-MM-dd', 'en-US'),
            end_date: formatDate(end, 'YYYY-MM-dd', 'en-US'),
          } satisfies OpenMeteoQueryParams,
        }
      : undefined;
  });

  private _currentLatLong = rxResource({
    loader: () => this.getCurrentLatLong(),
  });

  private getCurrentLatLong(): Observable<LatLong | null> {
    return new Observable((observer) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          observer.next({
            lat: position.coords.latitude,
            long: position.coords.longitude,
          });

          observer.complete();
        },
        (error) => {
          observer.error(`Error fetching user location: ${error}`);
        },
      );
    });
  }
}
