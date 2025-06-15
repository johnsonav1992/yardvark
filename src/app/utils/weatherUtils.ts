import { DailyWeatherCalendarForecast } from '../types/weather.types';

export const getForecastMarkerIcon = (
  forecast: DailyWeatherCalendarForecast
): string => {
  const { temperature, temperatureUnit, probabilityOfPrecipitation } = forecast;

  // Get precipitation probability (0-100)
  const precipitationChance = probabilityOfPrecipitation?.value || 0;

  if (temperatureUnit === 'F') {
    // If high chance of precipitation (>40%), show rain/snow icons regardless of temperature
    if (precipitationChance > 40) {
      if (temperature < 32) {
        return 'ti ti-snowflake'; // Snow when cold
      } else {
        return 'ti ti-cloud-rain'; // Rain when warm
      }
    }

    // If medium chance of precipitation (20-40%), show cloudy icons
    if (precipitationChance > 20) {
      return 'ti ti-cloud'; // Cloudy/overcast
    }

    // Low/no precipitation - use temperature-based icons
    if (temperature < 32) {
      return 'ti ti-snowflake'; // Cold but clear
    } else if (temperature < 60) {
      return 'ti ti-cloud'; // Cool
    } else if (temperature < 80) {
      return 'ti ti-sun'; // Pleasant/sunny
    } else {
      return 'ti ti-sun-high'; // Hot
    }
  } else {
    // Handle Celsius - convert thresholds
    const fahrenheitTemp = (temperature * 9) / 5 + 32;

    if (precipitationChance > 40) {
      if (fahrenheitTemp < 32) {
        return 'ti ti-snowflake';
      } else {
        return 'ti ti-cloud-rain';
      }
    }

    if (precipitationChance > 20) {
      return 'ti ti-cloud';
    }

    if (fahrenheitTemp < 32) {
      return 'ti ti-snowflake';
    } else if (fahrenheitTemp < 60) {
      return 'ti ti-cloud';
    } else if (fahrenheitTemp < 80) {
      return 'ti ti-sun';
    } else {
      return 'ti ti-sun-high';
    }
  }
};
