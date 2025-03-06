import { Component, computed, inject, OnInit } from '@angular/core';
import { SoilTemperatureService } from '../../services/soil-temperature.service';
import { getFullWeekStartAndEndDates } from '../../utils/timeUtils';
import { SoilTempWeekGraphComponent } from '../../components/soil-temp-week-graph/soil-temp-week-graph.component';
import { getAllDailySoilTemperatureAverages } from '../../utils/soilTemperatureUtils';

@Component({
  selector: 'soil-details',
  imports: [SoilTempWeekGraphComponent],
  templateUrl: './soil-details.component.html',
  styleUrl: './soil-details.component.scss',
})
export class SoilDetailsComponent implements OnInit {
  private _soilTemperatureService = inject(SoilTemperatureService);

  public dailyAverageTemps = computed(() => {
    const rawTempData =
      this._soilTemperatureService.weeklySoilTemperatureData.value()?.hourly
        .soil_temperature_6cm;

    return getAllDailySoilTemperatureAverages(rawTempData || []);
  });

  public isLoadingAveragesChartData = computed(() =>
    this._soilTemperatureService.weeklySoilTemperatureData.isLoading(),
  );

  public ngOnInit(): void {
    const { startDate, endDate } = getFullWeekStartAndEndDates();

    this._soilTemperatureService.startDate.set(startDate);
    this._soilTemperatureService.endDate.set(endDate);
  }
}
