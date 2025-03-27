import { computed, inject, Injectable, Signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { formatDate } from '@angular/common';
import {
  DailySoilTemperatureResponse,
  OpenMeteoQueryParams
} from '../types/openmeteo.types';
import { getRollingWeekStartAndEndDates } from '../utils/timeUtils';
import { injectSettingsService } from './settings.service';
import { isWithinInterval } from 'date-fns';
import { LocationService } from './location.service';

@Injectable({
  providedIn: 'root'
})
export class SoilTemperatureService {
  private _settingsService = injectSettingsService();
  private _locationService = inject(LocationService);

  private readonly _baseUrl = 'https://api.open-meteo.com/v1/forecast';
  private readonly _sharedQueryParams = computed<Partial<OpenMeteoQueryParams>>(
    () => ({
      hourly: ['soil_temperature_6cm', 'soil_temperature_18cm'],
      temperature_unit: this.temperatureUnit()!,
      timezone: 'auto'
    })
  );

  public temperatureUnit = computed(
    () =>
      this._settingsService.currentSettings()?.temperatureUnit || 'fahrenheit'
  );

  public past24HourSoilTemperatureData =
    httpResource<DailySoilTemperatureResponse>(() => {
      const coords =
        this._locationService.userLatLong() ||
        this._currentPositionLatLong?.value();
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
      const coords =
        this._locationService.userLatLong() ||
        this._currentPositionLatLong?.value();
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

  public getPointInTimeSoilTemperature = (
    shouldFetch: Signal<boolean>,
    date: Signal<Date | null>
  ) => {
    return httpResource<DailySoilTemperatureResponse>(() => {
      const coords =
        this._locationService.userLatLong() ||
        this._currentPositionLatLong?.value();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const maxFutureDate = new Date(today);
      maxFutureDate.setDate(today.getDate() + 7);
      maxFutureDate.setHours(23, 59, 59, 999);

      const isWithinFutureInterval =
        !!date() &&
        isWithinInterval(date()!, { start: today, end: maxFutureDate });

      return coords && shouldFetch() && date() && isWithinFutureInterval
        ? {
            url: this._baseUrl,
            params: {
              ...this._sharedQueryParams(),
              latitude: coords.lat,
              longitude: coords.long,
              start_hour: formatDate(
                date() || new Date(),
                'YYYY-MM-ddTHH:mm',
                'en-US'
              ),
              end_hour: formatDate(
                date() || new Date(),
                'YYYY-MM-ddTHH:mm',
                'en-US'
              )
            } satisfies OpenMeteoQueryParams
          }
        : undefined;
    });
  };

  private _currentPositionLatLong = rxResource({
    loader: () => this._locationService.getLatLongFromCurrentPosition()
  });
}
