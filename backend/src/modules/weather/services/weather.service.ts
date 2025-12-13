import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import {
  OpenMeteoHistoricalResponse,
  WeatherDotGovForecastResponse,
  WeatherDotGovPointsResponse,
} from '../models/weather.types';
import { tryCatch } from '../../../utils/tryCatch';

@Injectable()
export class WeatherService {
  private readonly _logger = new Logger(WeatherService.name);
  private readonly weatherDotGovBaseUrl = 'https://api.weather.gov';
  private readonly openMeteoHistoricalUrl =
    'https://historical-forecast-api.open-meteo.com/v1/forecast';

  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private _cacheManager: Cache,
    @Inject('FORECAST_CACHE_TTL') private _forecastCacheTtl: number,
    @Inject('HISTORICAL_CACHE_TTL') private _historicalCacheTtl: number,
  ) {}

  async getWeatherData(
    lat: string,
    long: string,
  ): Promise<WeatherDotGovForecastResponse> {
    const cacheKey = this.getCacheKey('forecast', { lat, long });

    const cached =
      await this._cacheManager.get<WeatherDotGovForecastResponse>(cacheKey);

    if (cached) {
      this._logger.debug(`Cache hit for forecast: ${cacheKey}`);
      return cached;
    }

    this._logger.debug(`Cache miss for forecast: ${cacheKey}`);

    const result = await tryCatch(() =>
      firstValueFrom(
        this.httpService
          .get<WeatherDotGovPointsResponse>(
            `${this.weatherDotGovBaseUrl}/points/${lat},${long}`,
          )
          .pipe(
            map((response) => response.data),
            switchMap((pointsData) => {
              const forecastUrl = pointsData.properties.forecast;

              if (!forecastUrl) {
                throw new Error('Forecast URL not found in response');
              }

              return this.httpService.get<WeatherDotGovForecastResponse>(
                forecastUrl,
              );
            }),
            map((forecastResponse) => forecastResponse.data),
          ),
      ),
    );

    if (!result.success) {
      throw new Error(`Failed to fetch weather data: ${result.error.message}`);
    }

    await this._cacheManager.set(cacheKey, result.data, this._forecastCacheTtl);

    return result.data;
  }

  async getHistoricalAirTemperatures({
    lat,
    long,
    startDate,
    endDate,
    temperatureUnit = 'fahrenheit',
  }: {
    lat: number;
    long: number;
    startDate: string;
    endDate: string;
    temperatureUnit?: 'fahrenheit' | 'celsius';
  }): Promise<Array<{ date: string; maxTemp: number; minTemp: number }>> {
    const cacheKey = this.getCacheKey('historical', {
      lat,
      long,
      startDate,
      endDate,
      temperatureUnit,
    });

    type HistoricalTempResult = Array<{
      date: string;
      maxTemp: number;
      minTemp: number;
    }>;

    const cached = await this._cacheManager.get<HistoricalTempResult>(cacheKey);

    if (cached) {
      this._logger.debug(`Cache hit for historical temps: ${cacheKey}`);
      return cached;
    }

    this._logger.debug(`Cache miss for historical temps: ${cacheKey}`);

    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(long),
      start_date: startDate,
      end_date: endDate,
      daily: 'temperature_2m_max,temperature_2m_min',
      temperature_unit: temperatureUnit,
      timezone: 'auto',
    });

    const result = await tryCatch(() =>
      firstValueFrom(
        this.httpService
          .get<OpenMeteoHistoricalResponse>(
            `${this.openMeteoHistoricalUrl}?${params}`,
          )
          .pipe(map((res) => res.data)),
      ),
    );

    if (!result.success) {
      throw new Error(
        `Failed to fetch historical temperatures: ${result.error.message}`,
      );
    }

    const { daily } = result.data;

    const data: HistoricalTempResult = daily.time.map(
      (date: string, i: number) => ({
        date,
        maxTemp: daily.temperature_2m_max[i],
        minTemp: daily.temperature_2m_min[i],
      }),
    );

    await this._cacheManager.set(cacheKey, data, this._historicalCacheTtl);

    return data;
  }

  private getCacheKey(
    type: 'forecast',
    params: { lat: string | number; long: string | number },
  ): string;
  private getCacheKey(
    type: 'historical',
    params: {
      lat: string | number;
      long: string | number;
      startDate: string;
      endDate: string;
      temperatureUnit: 'fahrenheit' | 'celsius' | undefined;
    },
  ): string;
  private getCacheKey(
    type: 'forecast' | 'historical',
    params: {
      lat: string | number;
      long: string | number;
      startDate?: string;
      endDate?: string;
      temperatureUnit?: 'fahrenheit' | 'celsius';
    },
  ): string {
    if (type === 'historical') {
      return `weather:historical:${params.lat}:${params.long}:${params.startDate}:${params.endDate}:${params.temperatureUnit}`;
    }
    return `weather:forecast:${params.lat}:${params.long}`;
  }
}
