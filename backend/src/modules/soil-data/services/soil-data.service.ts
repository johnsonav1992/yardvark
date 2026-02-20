import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { format, parseISO, isValid, subDays, addDays } from 'date-fns';
import { Either, error, success } from '../../../types/either';
import { LogHelpers } from '../../../logger/logger.helpers';
import {
  SoilDataResponse,
  RollingWeekSoilDataResponse,
} from '../models/soil-data.types';
import {
  OpenMeteoFetchError,
  InvalidDateFormatError,
  UserSettingsNotFoundError,
  UserLocationNotConfiguredError,
} from '../models/soil-data.errors';
import {
  SOIL_DATA_CACHE_TTL,
  OPEN_METEO_BASE_URL,
  SOIL_DATA_HOURLY_PARAMS,
} from '../models/soil-data.constants';
import { SettingsService } from '../../settings/services/settings.service';

interface OpenMeteoSoilResponse {
  hourly: {
    time: string[];
    soil_temperature_6cm: (number | null)[];
    soil_temperature_18cm: (number | null)[];
    soil_moisture_3_to_9cm: (number | null)[];
  };
}

@Injectable()
export class SoilDataService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly _cacheManager: Cache,
    private readonly _httpService: HttpService,
    private readonly _settingsService: SettingsService,
  ) {}

  public async fetchSoilDataForDate(
    userId: string,
    dateStr: string,
  ): Promise<
    Either<
      | InvalidDateFormatError
      | UserSettingsNotFoundError
      | UserLocationNotConfiguredError
      | OpenMeteoFetchError,
      SoilDataResponse
    >
  > {
    const date = parseISO(dateStr);

    if (!isValid(date)) {
      return error(new InvalidDateFormatError());
    }

    const userSettings = await this._settingsService.getUserSettings(userId);

    if (!userSettings || Array.isArray(userSettings)) {
      return error(new UserSettingsNotFoundError());
    }

    const { location, temperatureUnit } = userSettings.value;

    if (!location?.lat || !location?.long) {
      return error(new UserLocationNotConfiguredError());
    }

    const latitude = location.lat;
    const longitude = location.long;

    LogHelpers.addBusinessContext('date', format(date, 'yyyy-MM-dd'));
    LogHelpers.addBusinessContext('latitude', latitude);
    LogHelpers.addBusinessContext('longitude', longitude);

    const cacheKey = this.getCacheKey(
      date,
      latitude,
      longitude,
      temperatureUnit,
    );
    const cached = await this._cacheManager.get<SoilDataResponse>(cacheKey);

    if (cached) {
      LogHelpers.recordCacheHit();
      return success(cached);
    }

    LogHelpers.recordCacheMiss();

    const startTime = Date.now();
    let openMeteoData: OpenMeteoSoilResponse;

    try {
      const response = await firstValueFrom(
        this._httpService.get<OpenMeteoSoilResponse>(OPEN_METEO_BASE_URL, {
          params: {
            latitude,
            longitude,
            hourly: SOIL_DATA_HOURLY_PARAMS.join(','),
            temperature_unit: temperatureUnit,
            timezone: 'auto',
            start_date: format(date, 'yyyy-MM-dd'),
            end_date: format(date, 'yyyy-MM-dd'),
          },
        }),
      );

      openMeteoData = response.data;
      LogHelpers.recordExternalCall('open-meteo', Date.now() - startTime, true);
    } catch (err) {
      LogHelpers.recordExternalCall(
        'open-meteo',
        Date.now() - startTime,
        false,
      );
      return error(new OpenMeteoFetchError(err));
    }

    const dailyAverage = this.calculateDailyAverage(openMeteoData);

    const result: SoilDataResponse = {
      date: format(date, 'yyyy-MM-dd'),
      shallowTemp: dailyAverage.shallowTemp,
      deepTemp: dailyAverage.deepTemp,
      moisturePct: dailyAverage.moisturePct,
      temperatureUnit,
    };

    await this._cacheManager.set(cacheKey, result, SOIL_DATA_CACHE_TTL);

    return success(result);
  }

  public async fetchRollingWeekSoilData(
    userId: string,
  ): Promise<
    Either<
      | UserSettingsNotFoundError
      | UserLocationNotConfiguredError
      | OpenMeteoFetchError,
      RollingWeekSoilDataResponse
    >
  > {
    const userSettings = await this._settingsService.getUserSettings(userId);

    if (!userSettings || Array.isArray(userSettings)) {
      return error(new UserSettingsNotFoundError());
    }

    const { location, temperatureUnit } = userSettings.value;

    if (!location?.lat || !location?.long) {
      return error(new UserLocationNotConfiguredError());
    }

    const today = new Date();
    const dates: Date[] = [];

    for (let i = 7; i >= 0; i--) {
      dates.push(subDays(today, i));
    }

    for (let i = 1; i <= 7; i++) {
      dates.push(addDays(today, i));
    }

    const results: SoilDataResponse[] = [];

    for (const date of dates) {
      const result = await this.fetchSoilDataForDate(
        userId,
        format(date, 'yyyy-MM-dd'),
      );

      if (result.isError()) {
        return error(result.value);
      }

      results.push(result.value);
    }

    return success({
      dates: results.map((r) => r.date),
      shallowTemps: results.map((r) => r.shallowTemp),
      deepTemps: results.map((r) => r.deepTemp),
      moisturePcts: results.map((r) => r.moisturePct),
      temperatureUnit,
    });
  }

  private calculateDailyAverage(data: OpenMeteoSoilResponse): {
    shallowTemp: number | null;
    deepTemp: number | null;
    moisturePct: number | null;
  } {
    const calculateAvg = (values: (number | null)[]): number | null => {
      const validValues = values.filter((v): v is number => v !== null);

      if (validValues.length === 0) return null;

      return (
        Math.round(
          (validValues.reduce((sum, v) => sum + v, 0) / validValues.length) *
            10,
        ) / 10
      );
    };

    return {
      shallowTemp: calculateAvg(data.hourly.soil_temperature_6cm),
      deepTemp: calculateAvg(data.hourly.soil_temperature_18cm),
      moisturePct: calculateAvg(
        data.hourly.soil_moisture_3_to_9cm.map((v) =>
          v !== null ? v * 100 : null,
        ),
      ),
    };
  }

  private getCacheKey(
    date: Date,
    latitude: number,
    longitude: number,
    temperatureUnit: string,
  ): string {
    const roundedLat = Math.round(latitude * 10) / 10;
    const roundedLong = Math.round(longitude * 10) / 10;
    return `soil-data:${format(date, 'yyyy-MM-dd')}:${roundedLat}:${roundedLong}:${temperatureUnit}`;
  }
}
