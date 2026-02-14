import { Controller, Get, Query } from '@nestjs/common';
import { WeatherService } from '../services/weather.service';
import { resultOrThrow } from '../../../utils/unwrapResult';
import { LogHelpers } from '../../../logger/logger.helpers';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('forecast')
  public async getForecast(
    @Query('lat') lat: string,
    @Query('long') long: string,
  ) {
    LogHelpers.addBusinessContext('controller_operation', 'get_forecast');
    LogHelpers.addBusinessContext('forecast_lat', lat);
    LogHelpers.addBusinessContext('forecast_long', long);

    return resultOrThrow(await this.weatherService.getWeatherData(lat, long));
  }
}
