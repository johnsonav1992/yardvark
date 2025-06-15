export interface WeatherDotGovForecastResponse {
  '@context': [string, Context];
  type: string;
  geometry: ForecastGeometry;
  properties: ForecastProperties;
}

export interface Context {
  '@version': string;
  wx: string;
  s?: string;
  geo: string;
  unit: string;
  '@vocab': string;
}

export interface ForecastGeometry {
  type: string;
  coordinates: number[][][];
}

export interface ForecastProperties {
  units: string;
  forecastGenerator: string;
  generatedAt: string;
  updateTime: string;
  validTimes: string;
  elevation: Elevation;
  periods: Period[];
}

export interface Elevation {
  unitCode: string;
  value: number;
}

export interface Period {
  number: number;
  name: string;
  startTime: string;
  endTime: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: string;
  temperatureTrend: string;
  probabilityOfPrecipitation: ProbabilityOfPrecipitation;
  windSpeed: string;
  windDirection: string;
  icon: string;
  shortForecast: string;
  detailedForecast: string;
}

export interface ProbabilityOfPrecipitation {
  unitCode: string;
  value: number;
}

export type DailyWeatherCalendarForecast = {
  date: Date;
  temperature: number;
  temperatureUnit: string;
  shortForecast: string;
  probabilityOfPrecipitation: ProbabilityOfPrecipitation;
};
