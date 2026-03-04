export type TemperatureUnit = "fahrenheit" | "celsius";
export type GrassType = "warm" | "cool";
export type GddCycleStatus = "active" | "complete" | "overdue" | "dormant";

/**
 * Returns accumulated GDD since last PGR application
 */
export interface CurrentGddResponse {
	accumulatedGdd: number;
	lastPgrAppDate: string | null;
	daysSinceLastApp: number | null;
	baseTemperature: number;
	baseTemperatureUnit: TemperatureUnit;
	targetGdd: number;
	percentageToTarget: number;
	grassType: GrassType;
	cycleStatus: GddCycleStatus;
}

/**
 * Returns daily GDD values for a date range
 */
export interface HistoricalGddResponse {
	dailyGdd: DailyGddDataPoint[];
	totalGdd: number;
	startDate: string;
	endDate: string;
	baseTemperature: number;
	baseTemperatureUnit: TemperatureUnit;
}

/**
 * A single day's GDD data point
 */
export interface DailyGddDataPoint {
	date: string;
	gdd: number;
	highTemp: number;
	lowTemp: number;
	temperatureUnit: TemperatureUnit;
}

/**
 * Returns projected GDD for the next 7 days
 */
export interface GddForecastResponse {
	forecastedGdd: ForecastGddDataPoint[];
	projectedTotalGdd: number;
	currentAccumulatedGdd: number;
	targetGdd: number;
	projectedNextAppDate: string | null;
	daysUntilTarget: number | null;
}

/**
 * A single day's forecasted GDD data point
 */
export interface ForecastGddDataPoint {
	date: string;
	estimatedGdd: number;
	highTemp: number;
	lowTemp: number;
	temperatureUnit: TemperatureUnit;
}
