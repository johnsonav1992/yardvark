import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

interface WeatherPointsResponse {
  properties: {
    forecast: string;
  };
}

@Injectable()
export class WeatherService {
  constructor(private readonly httpService: HttpService) {}

  async getWeatherData(lat: string, long: string): Promise<any> {
    try {
      const forecast = await firstValueFrom(
        this.httpService
          .get<WeatherPointsResponse>(
            `https://api.weather.gov/points/${lat},${long}`,
          )
          .pipe(
            map((response) => response.data),
            switchMap((pointsData) => {
              const forecastUrl = pointsData.properties.forecast;
              return this.httpService.get(forecastUrl);
            }),
            map((forecastResponse) => forecastResponse.data),
          ),
      );

      return forecast;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch weather data: ${errorMessage}`);
    }
  }
}
