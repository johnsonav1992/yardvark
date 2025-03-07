import { Component, computed, inject } from '@angular/core';
import { SoilTemperatureService } from '../../services/soil-temperature.service';
import { SoilTempWeekGraphComponent } from '../../components/soil-data/soil-temp-week-graph/soil-temp-week-graph.component';
import { getAllDailySoilTemperatureAverages } from '../../utils/soilTemperatureUtils';

@Component({
  selector: 'soil-data',
  imports: [SoilTempWeekGraphComponent],
  templateUrl: './soil-data.component.html',
  styleUrl: './soil-data.component.scss'
})
export class SoilDataComponent {
  private _soilTemperatureService = inject(SoilTemperatureService);

  public dailyAverageShallowTemps = computed(() => {
    const rawTempData =
      this._soilTemperatureService.rollingWeekDailyAverageSoilData.value()
        ?.hourly.soil_temperature_6cm;

    return getAllDailySoilTemperatureAverages(rawTempData || []);
  });

  public dailyAverageDeepTemps = computed(() => {
    const rawTempData =
      this._soilTemperatureService.rollingWeekDailyAverageSoilData.value()
        ?.hourly.soil_temperature_18cm;

    return getAllDailySoilTemperatureAverages(rawTempData || []);
  });

  public isLoadingAveragesChartData = computed(() =>
    this._soilTemperatureService.rollingWeekDailyAverageSoilData.isLoading()
  );

  public tempUnit = computed(
    () => this._soilTemperatureService.temperatureUnit()!
  );
}
