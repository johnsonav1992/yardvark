import { Component, computed, inject, signal } from '@angular/core';
import { DegreesDisplay } from '../../types/types';
import {
  calculate24HourSoilTempAverage,
  getSoilTemperatureDisplayColor,
} from '../../utils/soilTemperatureUtils';
import { SoilTemperatureService } from '../../services/soil-temperature.service';
import { TooltipModule } from 'primeng/tooltip';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PopoverModule } from 'primeng/popover';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'soil-temperature-display',
  imports: [TooltipModule, ToggleSwitchModule, FormsModule, PopoverModule],
  templateUrl: './soil-temperature-display.component.html',
  styleUrl: './soil-temperature-display.component.scss',
})
export class SoilTemperatureDisplayComponent {
  private _soilTemperatureService = inject(SoilTemperatureService);

  public soilTemperatureData =
    this._soilTemperatureService.past24HourSoilTemperatureData;

  public showDeepTemp = signal<boolean>(false);

  public average24HourTemp = computed(() => {
    const hourlySoilTemperatures =
      this.soilTemperatureData.value()?.hourly[
        this.showDeepTemp() ? 'soil_temperature_18cm' : 'soil_temperature_6cm'
      ];

    if (!hourlySoilTemperatures?.length) return null;

    return calculate24HourSoilTempAverage(hourlySoilTemperatures);
  });

  public tempToDisplay = computed<DegreesDisplay<false> | null>(() => {
    const averageTemp = this.average24HourTemp();

    averageTemp && getSoilTemperatureDisplayColor(averageTemp);

    return averageTemp ? `${averageTemp}` : null;
  });

  public displayColor = computed(() => {
    const currentTemp = this.average24HourTemp();

    if (currentTemp) return getSoilTemperatureDisplayColor(currentTemp);

    return 'black';
  });
}
