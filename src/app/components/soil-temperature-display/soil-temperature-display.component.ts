import { Component, computed, inject } from '@angular/core';
import { DegreesDisplay } from '../../types/types';
import { getSoilTemperatureDisplayColor } from '../../utils/soilTemperatureUtils';
import { SoilTemperatureService } from '../../services/soil-temperature.service';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'soil-temperature-display',
  imports: [TooltipModule],
  templateUrl: './soil-temperature-display.component.html',
  styleUrl: './soil-temperature-display.component.scss',
})
export class SoilTemperatureDisplayComponent {
  private _soilTemperatureService = inject(SoilTemperatureService);

  public soilTemperatureData = this._soilTemperatureService.soilTemperatureData;

  public currentTemp = computed(() => {
    const hourlySoilTemperatures =
      this.soilTemperatureData.value()?.hourly.soil_temperature_18cm;
    const currentHour = new Date().getHours();

    return hourlySoilTemperatures?.[currentHour];
  });

  public tempToDisplay = computed<DegreesDisplay<false> | null>(() => {
    const currentTemp = this.currentTemp();

    currentTemp && getSoilTemperatureDisplayColor(currentTemp);

    return currentTemp ? `${currentTemp}` : null;
  });

  public displayColor = computed(() => {
    const currentTemp = this.currentTemp();

    if (currentTemp) return getSoilTemperatureDisplayColor(currentTemp);

    return 'black';
  });
}
