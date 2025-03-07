import { Component, computed, inject } from '@angular/core';
import { SoilTemperatureService } from '../../services/soil-temperature.service';
import { SoilTempWeekGraphComponent } from '../../components/soil-temp-week-graph/soil-temp-week-graph.component';
import { getAllDailySoilTemperatureAverages } from '../../utils/soilTemperatureUtils';

@Component({
  selector: 'soil-details',
  imports: [SoilTempWeekGraphComponent],
  templateUrl: './soil-details.component.html',
  styleUrl: './soil-details.component.scss',
})
export class SoilDetailsComponent {
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
    this._soilTemperatureService.rollingWeekDailyAverageSoilData.isLoading(),
  );

  public tempUnit = computed(
    () => this._soilTemperatureService.temperatureUnit()!,
  );
}
