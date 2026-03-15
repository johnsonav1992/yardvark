import { httpResource } from "@angular/common/http";
import { Injectable, inject, type Signal } from "@angular/core";
import { format } from "date-fns";
import { apiUrl } from "../utils/httpUtils";
import { LocationService } from "./location.service";

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
	private _locationService = inject(LocationService);

	public rollingWeekSoilData = httpResource<RollingWeekSoilData>(() =>
		this._locationService.userLatLong()
			? apiUrl("soil-data/rolling-week")
			: undefined,
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
