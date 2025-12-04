import { Injectable } from '@nestjs/common';
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
  private readonly weatherDotGovBaseUrl = 'https://api.weather.gov';
  private readonly openMeteoHistoricalUrl =
    'https://historical-forecast-api.open-meteo.com/v1/forecast';

  constructor(private readonly httpService: HttpService) {}

  async getWeatherData(
    lat: string,
    long: string,
  ): Promise<WeatherDotGovForecastResponse> {
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

    return result.data;
  }

  async getHistoricalAirTemperatures(
    lat: number,
    long: number,
    startDate: string,
    endDate: string,
    temperatureUnit: 'fahrenheit' | 'celsius' = 'fahrenheit',
  ): Promise<Array<{ date: string; maxTemp: number; minTemp: number }>> {
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

    return daily.time.map((date: string, i: number) => ({
      date,
      maxTemp: daily.temperature_2m_max[i],
      minTemp: daily.temperature_2m_min[i],
    }));
  }
}
