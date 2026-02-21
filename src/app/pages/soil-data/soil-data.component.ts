import { Component, computed, inject } from "@angular/core";
import { SoilDataService } from "../../services/soil-data.service";
import { SoilTempWeekGraphComponent } from "../../components/soil-data/soil-temp-week-graph/soil-temp-week-graph.component";
import { computeSoilTrend } from "../../utils/soilTemperatureUtils";
import { SoilMoistureWeekGraphComponent } from "../../components/soil-data/soil-moisture-week-graph/soil-moisture-week-graph.component";
import { SoilConditionsCardComponent } from "../../components/soil-data/soil-conditions-card/soil-conditions-card.component";
import { PageContainerComponent } from "../../components/layout/page-container/page-container.component";
import { LocationService } from "../../services/location.service";
import { ButtonModule } from "primeng/button";
import { Router } from "@angular/router";
import { CardModule } from "primeng/card";
import { PopoverModule } from "primeng/popover";
import { GlobalUiService } from "../../services/global-ui.service";
import { SettingsService } from "../../services/settings.service";
import { getDayLabelsCenteredAroundToday } from "../../utils/timeUtils";

@Component({
	selector: "soil-data",
	imports: [
		SoilTempWeekGraphComponent,
		SoilMoistureWeekGraphComponent,
		SoilConditionsCardComponent,
		PageContainerComponent,
		ButtonModule,
		CardModule,
		PopoverModule,
	],
	templateUrl: "./soil-data.component.html",
	styleUrl: "./soil-data.component.scss",
})
export class SoilDataComponent {
	private _soilDataService = inject(SoilDataService);
	private _settingsService = inject(SettingsService);
	private _locationService = inject(LocationService);
	private _router = inject(Router);
	private _globalUiService = inject(GlobalUiService);

	public isMobile = this._globalUiService.isMobile;

	public isLoadingSettings = computed(() =>
		this._settingsService.settings.isLoading(),
	);

	public userHasALocation = computed(
		() => !!this._locationService.userLatLong(),
	);

	public shouldShowEmptyState = computed(
		() => !this.isLoadingSettings() && !this.userHasALocation(),
	);

	private _allLabels = computed(() =>
		getDayLabelsCenteredAroundToday({
			includeDates: true,
			tinyDayNames: this.isMobile(),
			shortDayNames: !this.isMobile(),
		}),
	);

	private _rawShallowTemps = computed(() => {
		return (
			this._soilDataService.rollingWeekSoilData.value()?.shallowTemps || []
		);
	});

	private _rawDeepTemps = computed(() => {
		return this._soilDataService.rollingWeekSoilData.value()?.deepTemps || [];
	});

	private _rawMoistureData = computed(() => {
		return (
			this._soilDataService.rollingWeekSoilData.value()?.moisturePcts || []
		);
	});

	private _filteredChartData = computed(() => {
		const labels = this._allLabels();
		const shallow = this._rawShallowTemps();
		const deep = this._rawDeepTemps();
		const moisture = this._rawMoistureData();

		const filteredLabels: string[] = [];
		const filteredShallow: number[] = [];
		const filteredDeep: number[] = [];
		const filteredMoisture: number[] = [];
		let todayIndex = 0;

		for (let i = 0; i < labels.length; i++) {
			const hasData = !(
				shallow[i] === null &&
				deep[i] === null &&
				moisture[i] === null
			);

			if (!hasData) continue;

			if (i < 7) {
				todayIndex++;
			}

			filteredLabels.push(labels[i]);
			filteredShallow.push(shallow[i] ?? 0);
			filteredDeep.push(deep[i] ?? 0);
			filteredMoisture.push(moisture[i] ?? 0);
		}

		return {
			labels: filteredLabels,
			shallowTemps: filteredShallow,
			deepTemps: filteredDeep,
			moisture: filteredMoisture,
			todayIndex,
		};
	});

	public chartLabels = computed(() => this._filteredChartData().labels);
	public dailyAverageShallowTemps = computed(
		() => this._filteredChartData().shallowTemps,
	);
	public dailyAverageDeepTemps = computed(
		() => this._filteredChartData().deepTemps,
	);
	public dailyMoistureData = computed(() => this._filteredChartData().moisture);
	public todayIndex = computed(() => this._filteredChartData().todayIndex);

	public isLoadingAveragesChartData = computed(() =>
		this._soilDataService.rollingWeekSoilData.isLoading(),
	);

	public tempUnit = computed(
		() =>
			this._settingsService.currentSettings()?.temperatureUnit ?? "fahrenheit",
	);

	public grassType = computed(
		() => this._settingsService.currentSettings()?.grassType ?? "cool",
	);

	public currentShallowTemp = computed(() => {
		const todayAvg = this._rawShallowTemps()[7];

		return todayAvg !== null ? Math.round(todayAvg) : null;
	});

	public currentDeepTemp = computed(() => {
		const todayAvg = this._rawDeepTemps()[7];

		return todayAvg !== null ? Math.round(todayAvg) : null;
	});

	public currentMoisturePct = computed(() => {
		const todayAvg = this._rawMoistureData()[7];

		return todayAvg !== null ? Math.round(todayAvg) : null;
	});

	public tempTrend = computed(() => computeSoilTrend(this._rawShallowTemps()));

	public moistureTrend = computed(() =>
		computeSoilTrend(this._rawMoistureData()),
	);

	public goToSettings(): void {
		this._router.navigate(["settings"]);
	}
}
