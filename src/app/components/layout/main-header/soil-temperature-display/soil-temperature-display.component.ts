import { Component, computed, inject, signal, viewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { type Popover, PopoverModule } from "primeng/popover";
import { ToggleSwitchModule } from "primeng/toggleswitch";
import { TooltipModule } from "primeng/tooltip";
import { GlobalUiService } from "../../../../services/global-ui.service";
import { LocationService } from "../../../../services/location.service";
import { SettingsService } from "../../../../services/settings.service";
import { SoilDataService } from "../../../../services/soil-data.service";
import type { DegreesDisplay } from "../../../../types/temperature.styles";
import { fixOverlayPositionForScroll } from "../../../../utils/overlayPositioningUtils";
import { getSoilTemperatureDisplayColor } from "../../../../utils/soilTemperatureUtils";

@Component({
	selector: "soil-temperature-display",
	imports: [TooltipModule, ToggleSwitchModule, FormsModule, PopoverModule],
	templateUrl: "./soil-temperature-display.component.html",
	styleUrl: "./soil-temperature-display.component.scss",
})
export class SoilTemperatureDisplayComponent {
	private _soilDataService = inject(SoilDataService);
	private _settingsService = inject(SettingsService);
	private _globalUiService = inject(GlobalUiService);
	private _locationService = inject(LocationService);

	public isDarkMode = this._globalUiService.isDarkMode;
	public isMobile = this._globalUiService.isMobile;

	public soilTemperatureData = this._soilDataService.rollingWeekSoilData;

	public showDeepTemp = signal<boolean>(false);

	public depthPopover = viewChild.required<Popover>("depthPopover");

	public userHasALocation = computed(
		() => !!this._locationService.userLatLong(),
	);

	public currentTemp = computed(() => {
		const data = this._soilDataService.rollingWeekSoilData.value();

		if (!data) return null;

		const todayAverage = this.showDeepTemp()
			? data.deepTemps[7]
			: data.shallowTemps[7];

		return todayAverage !== null ? Math.round(todayAverage) : null;
	});

	public tempToDisplay = computed<DegreesDisplay<false> | null>(() => {
		const temp = this.currentTemp();

		return temp !== null ? `${temp}` : null;
	});

	public displayColor = computed(() => {
		const temp = this.currentTemp();

		if (temp !== null) return getSoilTemperatureDisplayColor(temp);

		return "black";
	});

	public tempUnit = computed(
		() =>
			this._settingsService.currentSettings()?.temperatureUnit || "fahrenheit",
	);

	public showPopover(event: Event): void {
		this.depthPopover().toggle(event);

		fixOverlayPositionForScroll(() =>
			this.depthPopover().overlayVisible ? this.depthPopover().container : null,
		);
	}
}
