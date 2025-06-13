import { httpResource } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { LocationService } from './location.service';
import { apiUrl } from '../utils/httpUtils';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private _locationService = inject(LocationService);

  public weatherData = httpResource(() => {
    const coords = this._locationService.userLatLong();
    return coords
      ? {
          url: apiUrl('weather/forecast', {
            queryParams: {
              lat: coords.lat,
              long: coords.long
            }
          })
        }
      : undefined;
  });
}
