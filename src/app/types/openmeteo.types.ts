export type DailySoilTemperatureResponse = {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  hourly_units: HourlyUnits;
  hourly: HourlySoilTemperatures;
};

export type HourlyUnits = {
  time: string;
  soil_temperature_6cm: string;
  soil_temperature_18cm: string;
};

export type HourlySoilTemperatures = {
  time: string[];
  soil_temperature_6cm: number[];
  soil_temperature_18cm: number[];
};

export type OpenMeteoQueryParams = {
  /**
   * Comma-separated floating point values
   */
  latitude: string | number;

  /**
   * Comma-separated floating point values
   */
  longitude: string | number;

  /**
   * Comma-separated floating point values
   */
  elevation?: string;

  /**
   * List of weather variables
   */
  hourly?: string[];

  /**
   * List of daily weather variable aggregations
   */
  daily?: string[];

  /**
   * List of weather variables for current conditions
   */
  current?: string[];

  /**
   * Temperature unit
   */
  temperature_unit?: 'celsius' | 'fahrenheit';

  /**
   * Wind speed unit
   */
  wind_speed_unit?: 'kmh' | 'ms' | 'mph' | 'kn';

  /**
   * Precipitation unit
   */
  precipitation_unit?: 'mm' | 'inch';

  /**
   * Time format
   */
  timeformat?: 'iso8601' | 'unixtime';

  /**
   * Any valid timezone name or "auto"
   */
  timezone?: string;

  /**
   * Number of past days (0-92)
   */
  past_days?: number;

  /**
   * Number of forecast days (0-16)
   */
  forecast_days?: number;

  /**
   * Number of forecast hours
   */
  forecast_hours?: number;

  /**
   * Number of forecast minutely 15
   */
  forecast_minutely_15?: number;

  /**
   * Number of past hours
   */
  past_hours?: number;

  /**
   * Number of past minutely 15
   */
  past_minutely_15?: number;

  /**
   * Start date in yyyy-mm-dd format
   */
  start_date?: string;

  /**
   * End date in yyyy-mm-dd format
   */
  end_date?: string;

  /**
   * Start hour in yyyy-mm-ddThh:mm format
   */
  start_hour?: string;

  /**
   * End hour in yyyy-mm-ddThh:mm format
   */
  end_hour?: string;

  /**
   * Start minutely 15 in yyyy-mm-ddThh:mm format
   */
  start_minutely_15?: string;

  /**
   * End minutely 15 in yyyy-mm-ddThh:mm format
   */
  end_minutely_15?: string;

  /**
   * List of weather models
   */
  models?: string[];

  /**
   * Cell selection
   */
  cell_selection?: 'land' | 'sea' | 'nearest';

  /**
   * API key (required for commercial use)
   */
  apikey?: string;
};
