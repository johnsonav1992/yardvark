import { CdkDragHandle } from "@angular/cdk/drag-drop";
import { Component, computed, inject, output } from "@angular/core";
import type { DividerDesignTokens } from "@primeuix/themes/types/divider";
import { differenceInDays, parseISO } from "date-fns";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { DividerModule } from "primeng/divider";
import { ProgressBarModule } from "primeng/progressbar";
import { TooltipModule } from "primeng/tooltip";
import { EmptyMessageComponent } from "../../miscellanious/empty-message/empty-message.component";
import { EntriesService } from "../../../services/entries.service";
import { GddService } from "../../../services/gdd.service";
import { GlobalUiService } from "../../../services/global-ui.service";
import { LocationService } from "../../../services/location.service";
import { SettingsService } from "../../../services/settings.service";
import { SoilDataService } from "../../../services/soil-data.service";
import { SubscriptionService } from "../../../services/subscription.service";
import { getLawnSeasonCompletedPercentageWithTemp } from "../../../utils/lawnSeasonUtils";
import { computeSoilTrend } from "../../../utils/soilTemperatureUtils";

@Component({
	selector: "quick-stats",
	imports: [
		CardModule,
		ButtonModule,
		TooltipModule,
		ProgressBarModule,
		DividerModule,
		CdkDragHandle,
		EmptyMessageComponent,
	],
	templateUrl: "./quick-stats.component.html",
	styleUrl: "./quick-stats.component.scss",
})
export class QuickStatsComponent {
	private _entriesService = inject(EntriesService);
	private _locationService = inject(LocationService);
	private _globalUiService = inject(GlobalUiService);
	private _soilDataService = inject(SoilDataService);
	private _settingsService = inject(SettingsService);
	private _gddService = inject(GddService);
	private _subscriptionService = inject(SubscriptionService);

	public isMobile = this._globalUiService.isMobile;
	public isPro = this._subscriptionService.isPro;

	public onHideWidget = output<void>();

	public userCoords = this._locationService.userLatLong;
	public temperatureUnit = computed(
		() =>
			this._settingsService.currentSettings()?.temperatureUnit || "fahrenheit",
	);

	public isLoading = this._entriesService.dashboardSummary.isLoading;

	public daysSinceLastMow = computed(() => {
		const lastMowDate =
			this._entriesService.dashboardSummary.value()?.lastMowDate;

		if (!lastMowDate) return "N/A";

		const now = new Date();
		const daysSince = differenceInDays(now, parseISO(lastMowDate.toString()));

		return daysSince ?? "N/A";
	});

	public daysSinceLastEntry = computed(() => {
		const lastEntry =
			this._entriesService.dashboardSummary.value()?.recentEntry;

		if (!lastEntry) return "N/A";

		const now = new Date();
		const daysSince = differenceInDays(
			now,
			parseISO(lastEntry.date.toString()),
		);

		return daysSince ?? "N/A";
	});

	public daysSinceLastProductApplication = computed(() => {
		const lastProductAppDate =
			this._entriesService.dashboardSummary.value()?.lastProductAppDate;

		if (!lastProductAppDate) return "N/A";

		const now = new Date();
		const daysSince = differenceInDays(
			now,
			parseISO(lastProductAppDate.toString()),
		);

		return daysSince ?? "N/A";
	});

	public currentSoilTemp = computed(() => {
		const soilData = this._soilDataService.rollingWeekSoilData.value();

		if (!soilData) return null;

		return soilData.shallowTemps[7];
	});

	public soilTempTrend = computed(() => {
		const soilData = this._soilDataService.rollingWeekSoilData.value();

		if (!soilData) return null;

		return computeSoilTrend(soilData.shallowTemps);
	});

	public tempUnitSymbol = computed(() =>
		this.temperatureUnit() === "fahrenheit" ? "°F" : "°C",
	);

	public lawnSeasonPercentage = computed(() => {
		const coords = this.userCoords();

		if (!coords) return null;

		const currentTemp = this.currentSoilTemp();
		const tempUnit = this.temperatureUnit();

		const progressPercentage = getLawnSeasonCompletedPercentageWithTemp(
			coords,
			currentTemp,
			tempUnit,
		);

		if (progressPercentage < 0 || progressPercentage > 100) {
			return null;
		}

		return progressPercentage;
	});

	public lawnSeasonPercentageLabel = computed(() => {
		const progress = this.lawnSeasonPercentage();
		return progress === null ? null : `${Math.round(progress)}%`;
	});

	public currentGddData = this._gddService.currentGdd;

	public hasGddData = computed(() => {
		const data = this.currentGddData.value();
		return data && data.lastPgrAppDate !== null;
	});

	public gddCycleStatus = computed(
		() => this.currentGddData.value()?.cycleStatus ?? "active",
	);

	public isGddDormant = computed(() => this.gddCycleStatus() === "dormant");
	public isGddOverdue = computed(() => this.gddCycleStatus() === "overdue");
	public isGddComplete = computed(() => this.gddCycleStatus() === "complete");

	public gddAccumulated = computed(
		() => this.currentGddData.value()?.accumulatedGdd ?? 0,
	);

	public gddTarget = computed(
		() => this.currentGddData.value()?.targetGdd ?? 200,
	);

	public gddPercentage = computed(
		() => this.currentGddData.value()?.percentageToTarget ?? 0,
	);

	public hasNoData = computed(
		() =>
			this.daysSinceLastEntry() === "N/A" &&
			this.daysSinceLastMow() === "N/A" &&
			this.daysSinceLastProductApplication() === "N/A",
	);

	public dividerDt: DividerDesignTokens = {
		horizontal: {
			margin: "none",
		},
	};

	public hideWidget(): void {
		this.onHideWidget.emit();
	}
}
