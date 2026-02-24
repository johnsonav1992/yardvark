import { format } from "date-fns";
import type { getEntryResponseMapping } from "../../entries/utils/entryUtils";

type MappedEntry = ReturnType<typeof getEntryResponseMapping>;

export interface EntryQueryDateRange {
	startDate: string;
	endDate: string;
}

export interface EntrySearchParams {
	dateRange?: EntryQueryDateRange;
	activities?: number[];
	lawnSegments?: number[];
	products?: number[];
	productCategories?: string[];
	titleOrNotes?: string;
}

export const sanitizeEntry = (entry: MappedEntry) => {
	return {
		id: entry.id,
		date: format(entry.date, "yyyy-MM-dd"),
		time: entry.time,
		title: entry.title,
		notes: entry.notes,
		soilTemperature: entry.soilTemperature,
		soilTemperatureUnit: entry.soilTemperatureUnit,
		mowingHeight: entry.mowingHeight,
		mowingHeightUnit: entry.mowingHeightUnit,
		activities: entry.activities.map((a) => ({ id: a.id, name: a.name })),
		lawnSegments: entry.lawnSegments.map((s) => ({
			id: s.id,
			name: s.name,
			size: s.size,
		})),
		products: entry.products.map((p) => ({
			id: p.id,
			name: p.name,
			brand: p.brand,
			category: p.category,
			quantity: p.quantity,
			quantityUnit: p.quantityUnit,
			guaranteedAnalysis: p.guaranteedAnalysis,
		})),
	};
};

export const sanitizeEntryLean = (entry: MappedEntry) => {
	return {
		id: entry.id,
		date: format(entry.date, "yyyy-MM-dd"),
		activities: entry.activities.map((a) => a.name),
		lawnSegments: entry.lawnSegments.map((s) => s.name),
		hasProducts: entry.products.length > 0,
	};
};

export const mergeUniqueNumberIds = (
	baseIds: number[],
	additionalIds: Array<number | null | undefined>,
): number[] => {
	return [
		...new Set([
			...baseIds,
			...additionalIds.filter((id): id is number => id != null),
		]),
	];
};

export const mapEntrySearchParamsToEntriesSearch = (
	params: EntrySearchParams,
	productIds: number[],
) => {
	return {
		dateRange: params.dateRange
			? [params.dateRange.startDate, params.dateRange.endDate]
			: ([] as string[]),
		activities: params.activities || ([] as number[]),
		lawnSegments: params.lawnSegments || ([] as number[]),
		products: productIds,
		titleOrNotes: params.titleOrNotes || "",
	};
};
