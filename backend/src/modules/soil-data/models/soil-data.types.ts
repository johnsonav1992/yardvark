export interface SoilDataResponse {
	/** Date of the soil data reading (YYYY-MM-DD) */
	date: string;
	/** Shallow soil temperature at 6cm depth */
	shallowTemp: number | null;
	/** Deep soil temperature at 18cm depth */
	deepTemp: number | null;
	/** Soil moisture percentage (0-100) */
	moisturePct: number | null;
	/** Temperature unit used for readings */
	temperatureUnit: "fahrenheit" | "celsius";
}

export interface RollingWeekSoilDataResponse {
	/** Array of dates (YYYY-MM-DD) */
	dates: string[];
	/** Array of shallow temps (6cm depth) */
	shallowTemps: (number | null)[];
	/** Array of deep temps (18cm depth) */
	deepTemps: (number | null)[];
	/** Array of moisture percentages */
	moisturePcts: (number | null)[];
	/** Temperature unit used for readings */
	temperatureUnit: "fahrenheit" | "celsius";
}

export interface SoilDataFetchRequest {
	/** Date to fetch soil data for */
	date: Date;
	/** User's latitude coordinate */
	latitude: number;
	/** User's longitude coordinate */
	longitude: number;
	/** Temperature unit preference */
	temperatureUnit: "fahrenheit" | "celsius";
}
