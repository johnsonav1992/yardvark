import { Component, computed, input } from '@angular/core';
import { HourlySoilTemperatures } from '../../types/openmeteo.types';
import { DegreesDisplay } from '../../types/types';

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

  public tempToDisplay = computed<DegreesDisplay | null>(() => {
    const currentHour = new Date().getHours();
    const currentTemp = this.hourlySoilTemperatures()?.[currentHour];

    return currentTemp ? `${currentTemp}°` : null;
  });
}
