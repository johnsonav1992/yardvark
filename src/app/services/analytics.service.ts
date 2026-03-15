import { httpResource } from "@angular/common/http";
import { Injectable, signal } from "@angular/core";
import { getYear } from "date-fns";
import type { AnalyticsRes } from "../types/analytics.types";
import { apiUrl } from "../utils/httpUtils";
import { injectSettingsService } from "./settings.service";

@Injectable({
	providedIn: "root",
})
export class AnalyticsService {
	private _settingsService = injectSettingsService();

	public year = signal(getYear(new Date()));

	private readonly _forceEnabled = signal(false);

	public enable(): void {
		this._forceEnabled.set(true);
	}

	public analyticsData = httpResource<AnalyticsRes>(() => {
		const hidden =
			this._settingsService.currentSettings()?.hiddenWidgets ?? [];
		const shouldFetch =
			this._forceEnabled() || !hidden.includes("lawn-health-score");

		return shouldFetch
			? apiUrl("analytics", { queryParams: { year: this.year() } })
			: undefined;
	});
}
