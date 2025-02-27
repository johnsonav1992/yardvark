import { Component, computed, input } from '@angular/core';
import { HourlySoilTemperatures } from '../../types/openmeteo.types';
import { DegreesDisplay } from '../../types/types';
import { getSoilTemperatureDisplayColor } from '../../utils/soilTemperatureUtils';

@Component({
  selector: 'soil-temperature-display',
  imports: [],
  templateUrl: './soil-temperature-display.component.html',
  styleUrl: './soil-temperature-display.component.scss',
})
export class SoilTemperatureDisplayComponent {
  public hourlySoilTemperatures = input.required<
    HourlySoilTemperatures['soil_temperature_18cm'] | undefined
  >();

  public currentTemp = computed(() => {
    const currentHour = new Date().getHours();
    return this.hourlySoilTemperatures()?.[currentHour];
  });

  public tempToDisplay = computed<DegreesDisplay | null>(() => {
    const currentTemp = this.currentTemp();

    return currentTemp ? `${currentTemp}°` : null;
  });

  public displayColor = computed(() => {
    if (this.currentTemp()) {
      return getSoilTemperatureDisplayColor(this.currentTemp()!);
    }

    return 'black';
  });
}
