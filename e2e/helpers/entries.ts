export type EntryResponse = {
	id: number;
	title?: string | null;
	notes?: string | null;
};

export function buildEntryDate() {
	const date = new Date();

	date.setHours(12, 0, 0, 0);

	return date;
}

export function buildEntryPayload(
	title: string | null,
	notes: string | null = null,
) {
	return {
		date: buildEntryDate().toISOString(),
		time: null,
		notes,
		title,
		soilTemperature: null,
		activityIds: [],
		lawnSegmentIds: [],
		products: [],
		soilTemperatureUnit: "fahrenheit",
		mowingHeight: null,
		mowingHeightUnit: "inches",
	};
}
