import { Component, inject, OnInit } from '@angular/core';
import { SoilTemperatureService } from '../../services/soil-temperature.service';
import { getFullWeekStartAndEndDates } from '../../utils/timeUtils';

@Component({
  selector: 'soil-details',
  imports: [],
  templateUrl: './soil-details.component.html',
  styleUrl: './soil-details.component.scss',
})
export class SoilDetailsComponent implements OnInit {
  private _soilTemperatureService = inject(SoilTemperatureService);

  public ngOnInit(): void {
    const { startDate, endDate } = getFullWeekStartAndEndDates();

    this._soilTemperatureService.startDate.set(startDate);
    this._soilTemperatureService.endDate.set(endDate);
  }
}
