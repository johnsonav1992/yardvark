/**
 * Cache TTL for soil data from Open-Meteo (4 hours in milliseconds)
 * Reduces API calls while keeping data reasonably fresh
 */
export const SOIL_DATA_CACHE_TTL = 14400000;

/**
 * Open-Meteo API base URL for soil data
 */
export const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * Soil data parameters to fetch from Open-Meteo
 */
export const SOIL_DATA_HOURLY_PARAMS = [
  'soil_temperature_6cm',
  'soil_temperature_18cm',
  'soil_moisture_3_to_9cm',
] as const;
