import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { LogHelpers } from "../../../logger/logger.helpers";
import { BusinessContextKeys } from "../../../logger/logger-keys.constants";
import { resultOrThrow } from "../../../utils/resultOrThrow";
import { WeatherService } from "../services/weather.service";

@Controller("weather")
export class WeatherController {
	constructor(private readonly weatherService: WeatherService) {}

	@Get("forecast")
	public async getForecast(
		@Query("lat") lat: string,
		@Query("long") long: string,
	) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"get_forecast",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.forecastLat, lat);
		LogHelpers.addBusinessContext(BusinessContextKeys.forecastLong, long);

		const latNum = parseFloat(lat);
		const longNum = parseFloat(long);

		if (
			Number.isNaN(latNum) ||
			Number.isNaN(longNum) ||
			latNum < -90 ||
			latNum > 90 ||
			longNum < -180 ||
			longNum > 180
		) {
			throw new BadRequestException("Invalid coordinates");
		}

		return resultOrThrow(await this.weatherService.getWeatherData(lat, long));
	}
}
