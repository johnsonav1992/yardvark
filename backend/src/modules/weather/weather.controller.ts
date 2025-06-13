import { Controller, Get, Query } from '@nestjs/common';
import { WeatherService } from './weather.service';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('forecast')
  async getForecast(@Query('lat') lat: string, @Query('long') long: string) {
    return this.weatherService.getWeatherData(lat, long);
  }
}
