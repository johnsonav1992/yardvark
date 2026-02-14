import { Controller, Get, Query } from '@nestjs/common';
import { WeatherService } from '../services/weather.service';
import { unwrapResult } from '../../../utils/unwrapResult';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('forecast')
  public async getForecast(
    @Query('lat') lat: string,
    @Query('long') long: string,
  ) {
    return unwrapResult(await this.weatherService.getWeatherData(lat, long));
  }
}
