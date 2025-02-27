import { inject, Injectable } from '@angular/core';
import { LatLong } from '../types/types';
import { Observable } from 'rxjs';
import { httpResource, HttpResourceRequest } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class SoilTemperatureService {
  private _datePipe = inject(DatePipe);

  private readonly _baseUrl = 'https://api.open-meteo.com/v1/forecast';

  public soilTemperatureData = httpResource(() => {
    const coords = this.currentLatLong.value();
    const today = this._datePipe.transform(new Date(), 'YYYY-MM-dd');

    if (coords && today) {
      return {
        url: this._baseUrl,
        params: {
          latitude: coords.lat,
          longitude: coords.long,
          hourly: 'soil_temperature_6cm',
          start_date: today,
          end_date: today,
          format: 'json',
        },
      };
    }

    return undefined;
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
