import { Component, computed, inject, signal } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PopoverModule } from 'primeng/popover';
import { FormsModule } from '@angular/forms';
import { SoilTemperatureService } from '../../../../services/soil-temperature.service';
import {
	calculate24HourNumericAverage,
	getSoilTemperatureDisplayColor,
} from '../../../../utils/soilTemperatureUtils';
import { injectSettingsService } from '../../../../services/settings.service';
import { DegreesDisplay } from '../../../../types/temperature.styles';
import { GlobalUiService } from '../../../../services/global-ui.service';
import { LocationService } from '../../../../services/location.service';

@Component({
	selector: 'soil-temperature-display',
	imports: [TooltipModule, ToggleSwitchModule, FormsModule, PopoverModule],
	templateUrl: './soil-temperature-display.component.html',
	styleUrl: './soil-temperature-display.component.scss',
})
export class SoilTemperatureDisplayComponent {
	private _soilTemperatureService = inject(SoilTemperatureService);
	private _settingsService = injectSettingsService();
	private _globalUiService = inject(GlobalUiService);
	private _locationService = inject(LocationService);

	public isDarkMode = this._globalUiService.isDarkMode;
	public isMobile = this._globalUiService.isMobile;

	public soilTemperatureData =
		this._soilTemperatureService.past24HourSoilTemperatureData;

	public showDeepTemp = signal<boolean>(false);

	public userHasALocation = computed(
		() => !!this._locationService.userLatLong(),
	);

	public average24HourTemp = computed(() => {
		const hourlySoilTemperatures =
			this.soilTemperatureData.value()?.hourly[
				this.showDeepTemp() ? 'soil_temperature_18cm' : 'soil_temperature_6cm'
			];

		if (!hourlySoilTemperatures?.length) return null;

		return calculate24HourNumericAverage(hourlySoilTemperatures);
	});

	public tempToDisplay = computed<DegreesDisplay<false> | null>(() => {
		const averageTemp = this.average24HourTemp();

		return averageTemp ? `${averageTemp}` : null;
	});

	public displayColor = computed(() => {
		const currentTemp = this.average24HourTemp();

		if (currentTemp) return getSoilTemperatureDisplayColor(currentTemp);

		return 'black';
	});

	public tempUnit = computed(
		() =>
			this._settingsService.currentSettings()?.temperatureUnit || 'fahrenheit',
	);
}
