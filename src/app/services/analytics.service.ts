import { httpResource } from "@angular/common/http";
import { Injectable, signal } from "@angular/core";
import { getYear } from "date-fns";
import type { AnalyticsRes } from "../types/analytics.types";
import { apiUrl } from "../utils/httpUtils";

@Injectable({
	providedIn: "root",
})
export class AnalyticsService {
	public year = signal(getYear(new Date()));

	private readonly _isEnabled = signal(false);

	public enable(): void {
		this._isEnabled.set(true);
	}

	public analyticsData = httpResource<AnalyticsRes>(() =>
		this._isEnabled()
			? apiUrl("analytics", { queryParams: { year: this.year() } })
			: undefined,
	);
}
