import { httpResource } from "@angular/common/http";
import { computed, Injectable, signal } from "@angular/core";
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
	private readonly _lawnHealthScoreHidden = computed(
		() =>
			this._settingsService.currentSettings()?.hiddenWidgets?.includes(
				"lawn-health-score",
			) ?? false,
	);

	public enable(): void {
		this._forceEnabled.set(true);
	}

	public analyticsData = httpResource<AnalyticsRes>(() => {
		const shouldFetch =
			this._forceEnabled() || !this._lawnHealthScoreHidden();

		return shouldFetch
			? apiUrl("analytics", { queryParams: { year: this.year() } })
			: undefined;
	});
}
