import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { formatDate } from '@angular/common';
import {
  DailySoilTemperatureResponse,
  OpenMeteoQueryParams
} from '../types/openmeteo.types';
import { getRollingDateWindowAroundToday } from '../utils/timeUtils';
import { injectSettingsService } from './settings.service';
import { addDays, isBefore, subHours, startOfDay } from 'date-fns';
import { LocationService } from './location.service';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SoilTemperatureService {
  private _settingsService = injectSettingsService();
  private _locationService = inject(LocationService);

  private readonly _baseUrl = 'https://api.open-meteo.com/v1/forecast';
  private readonly _historicalBaseUrl =
    'https://historical-forecast-api.open-meteo.com/v1/forecast';
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

  // Shutting this off for now - will find a way to toggle it later
  public useCurrentPositionLatLong = signal<boolean>(false);

  public past24HourSoilTemperatureData =
    httpResource<DailySoilTemperatureResponse>(() => {
      const coords =
        this._locationService.userLatLong() ||
        this._currentPositionLatLong?.value();
      const now = new Date();
      const endHour = formatDate(now, 'y-MM-ddTHH:00', 'en-US')!;
      const past24Hours = subHours(now, 24);
      const startHour = formatDate(past24Hours, 'y-MM-ddTHH:00', 'en-US')!;

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
      const { startDate, endDate } = getRollingDateWindowAroundToday();

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
              start_date: formatDate(startDate, 'y-MM-dd', 'en-US'),
              end_date: formatDate(endDate, 'y-MM-dd', 'en-US')
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
      const now = new Date();
      const todayStart = startOfDay(now);
      const maxFutureDate = addDays(now, 7);
      const isBeforeToday = isBefore(date() || now, todayStart);

      const isWithinFutureInterval =
        !!date() && isBefore(date()!, maxFutureDate);

      return coords && shouldFetch() && date() && isWithinFutureInterval
        ? {
            url: isBeforeToday ? this._historicalBaseUrl : this._baseUrl,
            params: {
              ...this._sharedQueryParams(),
              latitude: coords.lat,
              longitude: coords.long,
              start_hour: formatDate(
                date() || new Date(),
                'y-MM-ddTHH:mm',
                'en-US'
              ),
              end_hour: formatDate(
                date() || new Date(),
                'y-MM-ddTHH:mm',
                'en-US'
              )
            } satisfies OpenMeteoQueryParams
          }
        : undefined;
    });
  };

  private _currentPositionLatLong = rxResource({
    stream: () =>
      this.useCurrentPositionLatLong()
        ? this._locationService.getLatLongFromCurrentPosition()
        : of(undefined)
  });
}
