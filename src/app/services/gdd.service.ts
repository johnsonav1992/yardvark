import { httpResource } from "@angular/common/http";
import { Injectable, inject, type Signal } from "@angular/core";
import type {
	CurrentGddResponse,
	GddForecastResponse,
	HistoricalGddResponse,
} from "../types/gdd.types";
import { apiUrl } from "../utils/httpUtils";
import { LocationService } from "./location.service";

@Injectable({
	providedIn: "root",
})
export class GddService {
	private _locationService = inject(LocationService);

	public currentGdd = httpResource<CurrentGddResponse>(() =>
		this._locationService.userLatLong() ? apiUrl("gdd/current") : undefined,
	);

	public gddForecast = httpResource<GddForecastResponse>(() =>
		this._locationService.userLatLong() ? apiUrl("gdd/forecast") : undefined,
	);

	public getHistoricalGdd = (
		startDate: Signal<string | null>,
		endDate: Signal<string | null>,
	) =>
		httpResource<HistoricalGddResponse>(() =>
			startDate() && endDate()
				? apiUrl("gdd/historical", {
						queryParams: {
							startDate: startDate(),
							endDate: endDate(),
						},
					})
				: undefined,
		);
}
