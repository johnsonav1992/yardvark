import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import {
  WeatherDotGovForecastResponse,
  WeatherDotGovPointsResponse,
} from '../models/weather.types';
import { tryCatch } from '../../../utils/tryCatch';

@Injectable()
export class WeatherService {
  private readonly weatherDotGovBaseUrl = 'https://api.weather.gov';

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
}
