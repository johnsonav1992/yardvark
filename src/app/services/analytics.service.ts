import { httpResource } from "@angular/common/http";
import { Injectable, signal } from "@angular/core";
import { apiUrl } from "../utils/httpUtils";
import { AnalyticsRes } from "../types/analytics.types";
import { getYear } from "date-fns";

@Injectable({
	providedIn: "root",
})
export class AnalyticsService {
	public year = signal(getYear(new Date()));

	public analyticsData = httpResource<AnalyticsRes>(() =>
		apiUrl("analytics", { queryParams: { year: this.year() } }),
	);
}
