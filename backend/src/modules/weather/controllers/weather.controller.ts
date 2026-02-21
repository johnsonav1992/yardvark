import { Controller, Get, Query } from '@nestjs/common';
import { WeatherService } from '../services/weather.service';
import { resultOrThrow } from '../../../utils/resultOrThrow';
import { LogHelpers } from '../../../logger/logger.helpers';
import { BusinessContextKeys } from '../../../logger/logger-keys.constants';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('forecast')
  public async getForecast(
    @Query('lat') lat: string,
    @Query('long') long: string,
  ) {
    LogHelpers.addBusinessContext(
      BusinessContextKeys.controllerOperation,
      'get_forecast',
    );
    LogHelpers.addBusinessContext(BusinessContextKeys.forecastLat, lat);
    LogHelpers.addBusinessContext(BusinessContextKeys.forecastLong, long);

    return resultOrThrow(await this.weatherService.getWeatherData(lat, long));
  }
}
