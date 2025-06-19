import {
	FREEZING_TEMPERATURE_F,
	HIGH_TEMPERATURE_F,
	HOT_TEMPERATURE_F,
	MEDIUM_TEMPERATURE_F,
	RAIN_CHANCE_HEAVY_THRESHOLD,
	RAIN_CHANCE_LOW_THRESHOLD,
	RAIN_CHANCE_MEDIUM_THRESHOLD,
	WEATHER_ICONS,
} from '../constants/weather-constant';
import { DailyWeatherCalendarForecast } from '../types/weather.types';

export const getForecastMarkerIcon = (
	forecast: DailyWeatherCalendarForecast,
): string => {
	const { temperature, temperatureUnit, probabilityOfPrecipitation } = forecast;

	const precipitationChance = probabilityOfPrecipitation?.value || 0;

	if (temperatureUnit === 'F') {
		if (
			precipitationChance > RAIN_CHANCE_LOW_THRESHOLD &&
			temperature < FREEZING_TEMPERATURE_F
		) {
			return WEATHER_ICONS.snowflake;
		}

		if (precipitationChance > RAIN_CHANCE_HEAVY_THRESHOLD)
			return WEATHER_ICONS.heavyRain;

		if (precipitationChance > RAIN_CHANCE_MEDIUM_THRESHOLD)
			return WEATHER_ICONS.rain;

		if (precipitationChance > RAIN_CHANCE_LOW_THRESHOLD)
			return WEATHER_ICONS.cloud;

		if (temperature < FREEZING_TEMPERATURE_F) return WEATHER_ICONS.snowflake;
		if (temperature < MEDIUM_TEMPERATURE_F) return WEATHER_ICONS.cloud;
		if (temperature < HIGH_TEMPERATURE_F) return WEATHER_ICONS.sun;
		if (temperature < HOT_TEMPERATURE_F) return WEATHER_ICONS.sunnier;
		if (temperature >= HOT_TEMPERATURE_F) return WEATHER_ICONS.hot;

		return WEATHER_ICONS.sun;
	}

	return '';
};
