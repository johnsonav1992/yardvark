import { Entry } from "../models/entries.model";
import { getEntryResponseMapping } from "./entryUtils";
import {
	MONTH_MAP,
	SEASON_MAP,
	ACTIVITY_SYNONYM_MAP,
	QUERY_PATTERNS,
	QUERY_REPLACEMENTS,
	ACTIVITY_ENHANCEMENTS,
} from "./entryRagConstants";
import {
	getYear,
	getMonth,
	startOfMonth,
	endOfMonth,
	startOfYear,
	endOfYear,
	format as formatDate,
} from "date-fns";

export function extractDateRange(
	query: string,
): { startDate: string; endDate: string } | null {
	const lowerQuery = query.toLowerCase();
	const currentYear = getYear(new Date());

	const createRange = (year: number, month: number) => {
		const monthStart = startOfMonth(new Date(year, month));
		const monthEnd = endOfMonth(new Date(year, month));

		return {
			startDate: formatDate(monthStart, "yyyy-MM-dd"),
			endDate: formatDate(monthEnd, "yyyy-MM-dd"),
		};
	};

	const monthYearMatch = lowerQuery.match(QUERY_PATTERNS.MONTH_YEAR);

	if (monthYearMatch) {
		const monthNum = MONTH_MAP[monthYearMatch[1] as keyof typeof MONTH_MAP];

		if (monthNum !== undefined) {
			return createRange(parseInt(monthYearMatch[2]), monthNum);
		}
	}

	const monthOnlyMatch = lowerQuery.match(QUERY_PATTERNS.MONTH_ONLY);

	if (monthOnlyMatch) {
		const monthNum = MONTH_MAP[monthOnlyMatch[1] as keyof typeof MONTH_MAP];

		if (monthNum !== undefined) {
			return createRange(currentYear, monthNum);
		}
	}

	const yearMatch = lowerQuery.match(QUERY_PATTERNS.YEAR_ONLY);

	if (yearMatch) {
		const year = parseInt(yearMatch[1]);
		const yearStart = startOfYear(new Date(year, 0));
		const yearEnd = endOfYear(new Date(year, 0));

		return {
			startDate: formatDate(yearStart, "yyyy-MM-dd"),
			endDate: formatDate(yearEnd, "yyyy-MM-dd"),
		};
	}

	return null;
}

export function preprocessQuery(query: string): string {
	let processedQuery = query.toLowerCase();

	QUERY_REPLACEMENTS.forEach(([pattern, replacement]) => {
		processedQuery = processedQuery.replace(pattern, replacement);
	});

	ACTIVITY_ENHANCEMENTS.forEach(([pattern, enhancement]) => {
		if (pattern.test(processedQuery)) {
			processedQuery += enhancement;
		}
	});

	const monthMatch = processedQuery.match(QUERY_PATTERNS.MONTH_MATCH);

	if (monthMatch) {
		const month = monthMatch[1].toLowerCase();
		const season = getMonthSeason(month);

		processedQuery += ` ${month} ${season} seasonal lawn care`;
	}

	return processedQuery;
}

export function getMonthSeason(month: string): string {
	return SEASON_MAP[month.toLowerCase()] || "";
}

export function getActivitySynonyms(activities: { name: string }[]): string[] {
	return activities.flatMap((a) => {
		const activityName = a.name.toLowerCase();

		for (const [key, synonyms] of Object.entries(ACTIVITY_SYNONYM_MAP)) {
			if (activityName.includes(key) || key.includes(activityName))
				return synonyms;
		}

		return [];
	});
}

export function getSeason(date: Date): string {
	const month = getMonth(date);

	if (month >= 2 && month <= 4) return "spring";
	if (month >= 5 && month <= 7) return "summer";
	if (month >= 8 && month <= 10) return "fall";

	return "winter";
}

export function createEntryEmbeddingText(entry: Entry): string {
	const parts: string[] = [];

	if (entry.date) {
		const date = entry.date instanceof Date ? entry.date : new Date(entry.date);
		const dateString = formatDate(date, "yyyy-MM-dd");
		const monthName = formatDate(date, "MMMM");
		const year = getYear(date);

		parts.push(
			`Date: ${dateString}`,
			`Month: ${monthName}`,
			`Year: ${year}`,
			`Season: ${getSeason(date)}`,
		);
	}

	if (entry.activities?.length) {
		const activities = entry.activities.map((a) => a.name).join(", ");

		parts.push(`Lawn care activities performed: ${activities}`);

		const synonyms = getActivitySynonyms(entry.activities);

		if (synonyms.length) {
			parts.push(`Related lawn care tasks: ${synonyms.join(", ")}`);
		}
	}

	if (entry.entryProducts?.length) {
		const products = entry.entryProducts
			.filter((ep) => ep.product)
			.map(
				(ep) =>
					`Applied ${ep.product.category.toLowerCase()}: ${ep.product.name} at ${ep.productQuantity} ${ep.productQuantityUnit}`,
			);

		if (products.length) {
			parts.push(products.join(". "));
		}
	}

	if (entry.title) parts.push(`Task description: ${entry.title}`);
	if (entry.notes) parts.push(`Additional details: ${entry.notes}`);

	if (entry.lawnSegments?.length) {
		const segments = entry.lawnSegments.map((s) => s.name).join(", ");
		parts.push(`Areas of lawn treated: ${segments}`);
	}

	if (entry.soilTemperature) {
		parts.push(
			`Soil temperature recorded: ${entry.soilTemperature}°${entry.soilTemperatureUnit}`,
		);
	}

	return parts.join(". ");
}

export function buildContextFromEntries(entries: Entry[]): string {
	if (!entries || entries.length === 0) {
		return "No relevant entries found in lawn care history.";
	}

	return entries
		.map((entry, index) => {
			const mappedEntry = getEntryResponseMapping(entry);
			const parts = [`Entry ${index + 1}:`];

			parts.push(`Date: ${mappedEntry.date.toString()}`);

			if (mappedEntry.title) {
				parts.push(`Title: ${mappedEntry.title}`);
			}

			if (mappedEntry.notes) {
				parts.push(`Notes: ${mappedEntry.notes}`);
			}

			if (mappedEntry.activities?.length > 0) {
				const activities = mappedEntry.activities.map((a) => a.name).join(", ");

				parts.push(`Activities: ${activities}`);
			}

			if (mappedEntry.lawnSegments?.length > 0) {
				const segments = mappedEntry.lawnSegments.map((s) => s.name).join(", ");

				parts.push(`Lawn segments: ${segments}`);
			}

			if (mappedEntry.products?.length > 0) {
				const products = mappedEntry.products
					.map(
						(p) => `${p.category}: ${p.name} (${p.quantity} ${p.quantityUnit})`,
					)
					.join(", ");

				parts.push(`Products used: ${products}`);
			}

			if (mappedEntry.soilTemperature) {
				parts.push(
					`Soil temperature: ${mappedEntry.soilTemperature}°${mappedEntry.soilTemperatureUnit}`,
				);
			}

			return parts.join(" | ");
		})
		.join("\n\n");
}
