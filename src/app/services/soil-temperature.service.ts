import { computed, Injectable, signal } from '@angular/core';
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
  private readonly _baseOpenMeteoParams = computed<OpenMeteoQueryParams | null>(
    () => {
      const coords = this._currentLatLong.value();

      if (!coords) return null;

      return {
        latitude: coords.lat,
        longitude: coords.long,
        hourly: ['soil_temperature_6cm', 'soil_temperature_18cm'],
        temperature_unit: this.temperatureUnit(),
        timezone: 'auto',
      };
    },
  );

  public temperatureUnit =
    signal<OpenMeteoQueryParams['temperature_unit']>('fahrenheit');

  public past24HourSoilTemperatureData =
    httpResource<DailySoilTemperatureResponse>(() => {
      const baseParams = this._baseOpenMeteoParams();
      const now = new Date();
      const endHour = formatDate(now, 'YYYY-MM-ddTHH:00', 'en-US')!;
      const startHour = formatDate(
        new Date(now.getTime() - 24 * 60 * 60 * 1000),
        'YYYY-MM-ddTHH:00',
        'en-US',
      )!;

      return baseParams
        ? {
            url: this._baseUrl,
            params: {
              ...baseParams,
              start_hour: startHour,
              end_hour: endHour,
            } satisfies OpenMeteoQueryParams,
          }
        : undefined;
    });

  public weeklySoilTemperatureData = httpResource(() => {
    const baseParams = this._baseOpenMeteoParams();

    return baseParams
      ? {
          url: this._baseUrl,
          params: {
            ...baseParams,
            start_hour: '2023-12-01T00:00',
            end_hour: '2023-12-31T23:00',
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
