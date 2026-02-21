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

	public analyticsData = httpResource<AnalyticsRes>(() =>
		apiUrl("analytics", { queryParams: { year: this.year() } }),
	);
}
