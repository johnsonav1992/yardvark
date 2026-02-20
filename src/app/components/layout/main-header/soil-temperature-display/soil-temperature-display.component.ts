import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PopoverModule, Popover } from 'primeng/popover';
import { FormsModule } from '@angular/forms';
import { SoilTemperatureService } from '../../../../services/soil-temperature.service';
import {
  getAllDailyNumericDataAverages,
  getSoilTemperatureDisplayColor
} from '../../../../utils/soilTemperatureUtils';
import { injectSettingsService } from '../../../../services/settings.service';
import { DegreesDisplay } from '../../../../types/temperature.styles';
import { GlobalUiService } from '../../../../services/global-ui.service';
import { LocationService } from '../../../../services/location.service';
import { fixOverlayPositionForScroll } from '../../../../utils/overlayPositioningUtils';

@Component({
  selector: 'soil-temperature-display',
  imports: [TooltipModule, ToggleSwitchModule, FormsModule, PopoverModule],
  templateUrl: './soil-temperature-display.component.html',
  styleUrl: './soil-temperature-display.component.scss'
})
export class SoilTemperatureDisplayComponent {
  private _soilTemperatureService = inject(SoilTemperatureService);
  private _settingsService = injectSettingsService();
  private _globalUiService = inject(GlobalUiService);
  private _locationService = inject(LocationService);

  public isDarkMode = this._globalUiService.isDarkMode;
  public isMobile = this._globalUiService.isMobile;

  public soilTemperatureData =
    this._soilTemperatureService.rollingWeekDailyAverageSoilData;

  public showDeepTemp = signal<boolean>(false);

  public depthPopover = viewChild.required<Popover>('depthPopover');

  public userHasALocation = computed(
    () => !!this._locationService.userLatLong()
  );

  public currentTemp = computed(() => {
    const hourlySoilTemperatures =
      this.soilTemperatureData.value()?.hourly[
        this.showDeepTemp() ? 'soil_temperature_18cm' : 'soil_temperature_6cm'
      ];

    if (!hourlySoilTemperatures?.length) return null;

    const dailyAverages = getAllDailyNumericDataAverages(
      hourlySoilTemperatures
    );
    const todayAverage = dailyAverages[7];

    return todayAverage !== null ? Math.round(todayAverage) : null;
  });

  public tempToDisplay = computed<DegreesDisplay<false> | null>(() => {
    const temp = this.currentTemp();

    return temp !== null ? `${temp}` : null;
  });

  public displayColor = computed(() => {
    const temp = this.currentTemp();

    if (temp !== null) return getSoilTemperatureDisplayColor(temp);

    return 'black';
  });

  public tempUnit = computed(
    () =>
      this._settingsService.currentSettings()?.temperatureUnit || 'fahrenheit'
  );

  public showPopover(event: Event): void {
    this.depthPopover().toggle(event);

    fixOverlayPositionForScroll(() =>
      this.depthPopover().overlayVisible ? this.depthPopover().container : null
    );
  }
}
