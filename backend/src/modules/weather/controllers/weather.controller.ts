import { Controller, Get, HttpException, Query } from '@nestjs/common';
import type { WeatherService } from '../services/weather.service';
import { tryCatch } from 'src/utils/tryCatch';
import { HttpStatusCode } from 'axios';

@Controller('weather')
export class WeatherController {
	constructor(private readonly weatherService: WeatherService) {}

	@Get('forecast')
	async getForecast(@Query('lat') lat: string, @Query('long') long: string) {
		const { data, error } = await tryCatch(() =>
			this.weatherService.getWeatherData(lat, long)
		);

		if (error) {
			return new HttpException(
				'Failed to fetch weather data',
				HttpStatusCode.InternalServerError
			);
		}

		return data;
	}
}
