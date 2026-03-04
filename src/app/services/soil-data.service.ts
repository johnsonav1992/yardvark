import { httpResource } from "@angular/common/http";
import { Injectable, type Signal } from "@angular/core";
import { format } from "date-fns";
import { apiUrl } from "../utils/httpUtils";

export interface SoilDataResponse {
	date: string;
	shallowTemp: number | null;
	deepTemp: number | null;
	moisturePct: number | null;
	temperatureUnit: "fahrenheit" | "celsius";
}

export interface RollingWeekSoilData {
	dates: string[];
	shallowTemps: (number | null)[];
	deepTemps: (number | null)[];
	moisturePcts: (number | null)[];
	temperatureUnit: "fahrenheit" | "celsius";
}

@Injectable({
	providedIn: "root",
})
export class SoilDataService {
	public rollingWeekSoilData = httpResource<RollingWeekSoilData>(() =>
		apiUrl("soil-data/rolling-week"),
	);

	public getSoilDataForDate = (
		shouldFetch: Signal<boolean>,
		date: Signal<Date | null>,
	) => {
		return httpResource<SoilDataResponse>(() =>
			shouldFetch() && date()
				? apiUrl("soil-data", { params: [format(date()!, "yyyy-MM-dd")] })
				: undefined,
		);
	};
}
