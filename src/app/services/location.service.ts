import { Injectable, linkedSignal, signal } from '@angular/core';
import { getReq } from '../utils/httpUtils';
import { LatLong, MapboxGeocodingResponse } from '../types/location.types';
import { map } from 'rxjs';
import { Observable } from 'rxjs';
import { injectSettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private _settingsService = injectSettingsService();

  private readonly _mapboxGeocodingUrl =
    'https://api.mapbox.com/search/geocode/v6/forward';

  public searchForLocation(query: string) {
    return getReq<MapboxGeocodingResponse>(this._mapboxGeocodingUrl, {
      params: {
        proximity: 'ip',
        q: query,
        access_token:
          'pk.eyJ1Ijoiam9obnNvbmF2IiwiYSI6ImNtOG1mMWE0aDBnbjgyaW9tcWc2c2JhczUifQ.2jMp1pCJKr2RDKIVfXwwNQ'
      }
    }).pipe(map((response) => response.features));
  }

  public userLatLong = linkedSignal<LatLong | null>(() => {
    const location = this._settingsService.currentSettings()?.location;

    return location ? { lat: location.lat, long: location.long } : null;
  });

  public getLatLongFromCurrentPosition(): Observable<LatLong | null> {
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
