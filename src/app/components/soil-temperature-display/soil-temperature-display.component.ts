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

    console.log({ currentHour });
    console.log(this.hourlySoilTemperatures());
    return this.hourlySoilTemperatures()?.[currentHour];
  });

  public tempToDisplay = computed<DegreesDisplay | null>(() => {
    const currentTemp = this.currentTemp();

    console.log(currentTemp);

    return currentTemp ? `${currentTemp}°` : null;
  });

  public displayColor = computed(() => {
    const currentTemp = this.currentTemp();

    if (currentTemp) {
      return getSoilTemperatureDisplayColor(currentTemp);
    }

    return 'black';
  });
}
