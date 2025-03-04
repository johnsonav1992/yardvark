import { Injectable } from '@angular/core';
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

  public past24HourSoilTemperatureData =
    httpResource<DailySoilTemperatureResponse>(() => {
      const coords = this.currentLatLong.value();
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
              temperature_unit: 'fahrenheit',
              start_hour: startHour,
              end_hour: endHour,
              timezone: 'auto',
            } satisfies OpenMeteoQueryParams,
          }
        : undefined;
    });

  public currentLatLong = rxResource({
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
