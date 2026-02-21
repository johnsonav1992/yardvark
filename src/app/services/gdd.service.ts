import { httpResource } from "@angular/common/http";
import { Injectable, Signal } from "@angular/core";
import {
	CurrentGddResponse,
	GddForecastResponse,
	HistoricalGddResponse,
} from "../types/gdd.types";
import { apiUrl } from "../utils/httpUtils";

@Injectable({
	providedIn: "root",
})
export class GddService {
	public currentGdd = httpResource<CurrentGddResponse>(() =>
		apiUrl("gdd/current"),
	);

	public gddForecast = httpResource<GddForecastResponse>(() =>
		apiUrl("gdd/forecast"),
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
