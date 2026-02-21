import {
	FREEZING_TEMPERATURE_F,
	HIGH_TEMPERATURE_F,
	HOT_TEMPERATURE_F,
	MEDIUM_TEMPERATURE_F,
	RAIN_CHANCE_HEAVY_THRESHOLD,
	RAIN_CHANCE_LOW_THRESHOLD,
	RAIN_CHANCE_MEDIUM_THRESHOLD,
	WEATHER_ICONS,
} from "../constants/weather-constant";
import {
	DailyWeatherCalendarForecast,
	WeatherPeriod,
} from "../types/weather.types";
import { getHours } from "date-fns";

/**
 * Determines if the forecast is for night-time based on isDaytime property or time-based fallback logic
 */
const isNightTime = (forecast: DailyWeatherCalendarForecast): boolean => {
	if (forecast.isDaytime != null) return !forecast.isDaytime;

	const hour = getHours(forecast.date);

	return hour < 6 || hour >= 20;
};

export const convertPeriodToForecast = (
	period: WeatherPeriod,
): DailyWeatherCalendarForecast => {
	return {
		date: new Date(period.startTime),
		temperature: period.temperature,
		temperatureUnit: period.temperatureUnit,
		shortForecast: period.shortForecast,
		probabilityOfPrecipitation: period.probabilityOfPrecipitation,
		icon: period.icon,
		isDaytime: period.isDaytime,
	};
};

export const getForecastMarkerIcon = (
	forecast: DailyWeatherCalendarForecast,
): string => {
	const { temperature, temperatureUnit, probabilityOfPrecipitation } = forecast;

	const precipitationChance = probabilityOfPrecipitation?.value || 0;
	const isNight = isNightTime(forecast);

	if (temperatureUnit === "F") {
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

		if (precipitationChance > RAIN_CHANCE_LOW_THRESHOLD) {
			return isNight ? WEATHER_ICONS.cloudNight : WEATHER_ICONS.cloud;
		}

		if (temperature < FREEZING_TEMPERATURE_F) return WEATHER_ICONS.snowflake;

		if (temperature < MEDIUM_TEMPERATURE_F) {
			return isNight ? WEATHER_ICONS.cloudNight : WEATHER_ICONS.cloud;
		}

		if (temperature < HIGH_TEMPERATURE_F) {
			return isNight ? WEATHER_ICONS.moon : WEATHER_ICONS.sun;
		}

		if (temperature < HOT_TEMPERATURE_F) {
			return isNight ? WEATHER_ICONS.moonStars : WEATHER_ICONS.sunnier;
		}

		if (temperature >= HOT_TEMPERATURE_F) {
			return isNight ? WEATHER_ICONS.moonStars : WEATHER_ICONS.hot;
		}

		return isNight ? WEATHER_ICONS.moon : WEATHER_ICONS.sun;
	}

	return "";
};
