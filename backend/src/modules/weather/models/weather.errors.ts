import { ExternalServiceError } from '../../../errors/resource-error';

export class WeatherFetchError extends ExternalServiceError {
  constructor(originalError?: Error | unknown) {
    super({
      message: 'Failed to fetch weather data',
      code: 'WEATHER_FETCH_ERROR',
      error: originalError,
    });
  }
}

export class HistoricalWeatherFetchError extends ExternalServiceError {
  constructor(originalError?: Error | unknown) {
    super({
      message: 'Failed to fetch historical temperatures',
      code: 'HISTORICAL_WEATHER_FETCH_ERROR',
      error: originalError,
    });
  }
}
