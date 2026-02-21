export const MONTH_MAP = {
	january: 0,
	jan: 0,
	february: 1,
	feb: 1,
	march: 2,
	mar: 2,
	april: 3,
	apr: 3,
	may: 4,
	june: 5,
	jun: 5,
	july: 6,
	jul: 6,
	august: 7,
	aug: 7,
	september: 8,
	sep: 8,
	october: 9,
	oct: 9,
	november: 10,
	nov: 10,
	december: 11,
	dec: 11,
};

export const SEASON_MAP: { [key: string]: string } = {
	december: "winter",
	january: "winter",
	february: "winter",
	march: "spring",
	april: "spring",
	may: "spring",
	june: "summer",
	july: "summer",
	august: "summer",
	september: "fall",
	october: "fall",
	november: "fall",
};

export const ACTIVITY_SYNONYM_MAP: { [key: string]: string[] } = {
	mow: [
		"cutting grass",
		"lawn cutting",
		"grass maintenance",
		"mowing",
		"trim",
		"trimming",
	],
	fertilize: [
		"feeding lawn",
		"nutrient application",
		"lawn feeding",
		"fertilizing",
		"fertilizer",
	],
	water: [
		"irrigation",
		"lawn hydration",
		"grass watering",
		"watering",
		"sprinkler",
	],
	weed: ["weed control", "herbicide application", "weeding", "weed killer"],
	seed: ["seeding", "overseeding", "grass seeding", "lawn seeding"],
	aerate: ["aerating", "aeration", "lawn aeration", "core aeration"],
};

export const QUERY_PATTERNS = {
	MONTH_YEAR:
		/(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})/,
	MONTH_ONLY:
		/(?:in|during)\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/,
	YEAR_ONLY: /\b(?:in\s+)?(\d{4})\b/,
	MONTH_MATCH:
		/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
	MOW_ACTIVITY: /\bmow|cut|cutting\b/i,
	FERTILIZE_ACTIVITY: /\bfertilize|feed\b/i,
	WATER_ACTIVITY: /\bwater|irrigate\b/i,
};

export const QUERY_REPLACEMENTS = [
	[/\bhow many times\b/gi, "frequency count of"],
	[/\bdid i\b/gi, "performed"],
	[/\bcount\b/gi, "number of times"],
] as const;

export const ACTIVITY_ENHANCEMENTS = [
	[QUERY_PATTERNS.MOW_ACTIVITY, " lawn cutting grass maintenance mowing"],
	[
		QUERY_PATTERNS.FERTILIZE_ACTIVITY,
		" fertilizing nutrient application lawn feeding",
	],
	[QUERY_PATTERNS.WATER_ACTIVITY, " watering irrigation lawn hydration"],
] as const;
