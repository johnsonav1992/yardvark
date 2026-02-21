import { httpResource } from "@angular/common/http";
import { computed, Injectable, inject } from "@angular/core";
import type {
	DailyWeatherCalendarForecast,
	WeatherDotGovForecastResponse,
} from "../types/weather.types";
import { apiUrl } from "../utils/httpUtils";
import { LocationService } from "./location.service";

@Injectable({
	providedIn: "root",
})
export class WeatherService {
	private _locationService = inject(LocationService);

	public weatherDataResource = httpResource<WeatherDotGovForecastResponse>(
		() => {
			const coords = this._locationService.userLatLong();
			return coords
				? {
						url: apiUrl("weather/forecast", {
							queryParams: {
								lat: coords.lat,
								long: coords.long,
							},
						}),
					}
				: undefined;
		},
	);

	public weatherForecastData = computed(
		() => this.weatherDataResource.value()?.properties.periods || [],
	);

	public dailyWeatherForecasts = computed<DailyWeatherCalendarForecast[]>(
		() => {
			return this.weatherForecastData()
				.filter((per) => per.isDaytime)
				.map((period) => {
					return {
						date: new Date(period.startTime),
						temperature: period.temperature,
						temperatureUnit: period.temperatureUnit,
						shortForecast: period.shortForecast,
						probabilityOfPrecipitation: period.probabilityOfPrecipitation,
						icon: period.icon,
					};
				});
		},
	);
}
