import { format, parse } from "date-fns";
import { Entry, EntryProduct } from "../types/entries.types";
import { Activity } from "../types/activities.types";
import { LawnSegment } from "../types/lawnSegments.types";
import { CsvExportConfig } from "../types/csv.types";

export const formatDateForCsv = (dateString: string): string => {
	if (!dateString) return "";

	try {
		const date = new Date(dateString);
		return format(date, "MM-dd-yyyy");
	} catch {
		return dateString;
	}
};

export const formatTimeForCsv = (timeString: string): string => {
	if (!timeString) return "";

	try {
		const parsedTime = parse(timeString, "HH:mm:ss", new Date());
		return format(parsedTime, "h:mm a");
	} catch {
		try {
			const parsedTime = parse(timeString, "HH:mm", new Date());
			return format(parsedTime, "h:mm a");
		} catch {
			return timeString;
		}
	}
};

export const formatActivitiesForCsv = (activities: Activity[]): string => {
	if (!activities || activities.length === 0) return "";
	return activities.map((activity) => activity.name).join("; ");
};

export const formatLawnSegmentsForCsv = (segments: LawnSegment[]): string => {
	if (!segments || segments.length === 0) return "";
	return segments.map((segment) => segment.name).join("; ");
};

export const formatProductsForCsv = (products: EntryProduct[]): string => {
	if (!products || products.length === 0) return "";
	return products
		.map((product) => {
			const brand = product.brand ? `${product.brand} ` : "";
			return `${brand}${product.name}`;
		})
		.join("; ");
};

export const formatProductQuantitiesForCsv = (
	products: EntryProduct[],
): string => {
	if (!products || products.length === 0) return "";
	return products
		.map((product) => `${product.quantity} ${product.quantityUnit}`)
		.join("; ");
};

export const getEntryCsvConfig = (
	filename?: string,
): CsvExportConfig<Entry> => ({
	headers: [
		"ID",
		"Date",
		"Time",
		"Title",
		"Notes",
		"Soil Temperature",
		"Soil Temperature Unit",
		"Activities",
		"Lawn Segments",
		"Products",
		"Product Quantities",
		"Images Count",
	],
	rowMapper: (entry: Entry) => [
		entry.id,
		formatDateForCsv(entry.date),
		formatTimeForCsv(entry.time),
		entry.title,
		entry.notes,
		entry.soilTemperature,
		entry.soilTemperatureUnit,
		formatActivitiesForCsv(entry.activities),
		formatLawnSegmentsForCsv(entry.lawnSegments),
		formatProductsForCsv(entry.products),
		formatProductQuantitiesForCsv(entry.products),
		entry.images?.length || 0,
	],
	filename,
});
