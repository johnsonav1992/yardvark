import { Component, computed, inject } from '@angular/core';
import { SoilTemperatureService } from '../../services/soil-temperature.service';
import { SoilTempWeekGraphComponent } from '../../components/soil-data/soil-temp-week-graph/soil-temp-week-graph.component';
import {
  computeSoilTrend,
  getAllDailyNumericDataAverages,
  getMostRecentValue
} from '../../utils/soilTemperatureUtils';
import { SoilMoistureWeekGraphComponent } from '../../components/soil-data/soil-moisture-week-graph/soil-moisture-week-graph.component';
import { SoilConditionsCardComponent } from '../../components/soil-data/soil-conditions-card/soil-conditions-card.component';
import { PageContainerComponent } from '../../components/layout/page-container/page-container.component';
import { LocationService } from '../../services/location.service';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { PopoverModule } from 'primeng/popover';
import { GlobalUiService } from '../../services/global-ui.service';
import { injectSettingsService } from '../../services/settings.service';
import {
  getDayLabelsCenteredAroundToday,
  HOURS_IN_A_DAY
} from '../../utils/timeUtils';

@Component({
  selector: 'soil-data',
  imports: [
    SoilTempWeekGraphComponent,
    SoilMoistureWeekGraphComponent,
    SoilConditionsCardComponent,
    PageContainerComponent,
    ButtonModule,
    CardModule,
    PopoverModule
  ],
  templateUrl: './soil-data.component.html',
  styleUrl: './soil-data.component.scss'
})
export class SoilDataComponent {
  private _soilTemperatureService = inject(SoilTemperatureService);
  private _settingsService = injectSettingsService();
  private _locationService = inject(LocationService);
  private _router = inject(Router);
  private _globalUiService = inject(GlobalUiService);

  public isMobile = this._globalUiService.isMobile;

  public userHasALocation = computed(
    () => !!this._locationService.userLatLong()
  );

  private _allLabels = computed(() =>
    getDayLabelsCenteredAroundToday({
      includeDates: true,
      tinyDayNames: this.isMobile(),
      shortDayNames: !this.isMobile()
    })
  );

  private _rawShallowTemps = computed(() => {
    const rawTempData =
      this._soilTemperatureService.rollingWeekDailyAverageSoilData.value()
        ?.hourly.soil_temperature_6cm;

    return getAllDailyNumericDataAverages(rawTempData || []);
  });

  private _rawDeepTemps = computed(() => {
    const rawTempData =
      this._soilTemperatureService.rollingWeekDailyAverageSoilData.value()
        ?.hourly.soil_temperature_18cm;

    return getAllDailyNumericDataAverages(rawTempData || []);
  });

  private _rawMoistureData = computed(() => {
    const rawMoistureData =
      this._soilTemperatureService.rollingWeekDailyAverageSoilData.value()
        ?.hourly.soil_moisture_3_to_9cm;

    return getAllDailyNumericDataAverages(rawMoistureData || [], {
      precision: 2,
      multiplicationFactor: 100
    });
  });

  private _filteredChartData = computed(() => {
    const labels = this._allLabels();
    const shallow = this._rawShallowTemps();
    const deep = this._rawDeepTemps();
    const moisture = this._rawMoistureData();

    const filteredLabels: string[] = [];
    const filteredShallow: number[] = [];
    const filteredDeep: number[] = [];
    const filteredMoisture: number[] = [];
    let todayIndex = 0;

    for (let i = 0; i < labels.length; i++) {
      const hasData = !(
        shallow[i] === null &&
        deep[i] === null &&
        moisture[i] === null
      );

      if (!hasData) continue;

      if (i < 7) {
        todayIndex++;
      }

      filteredLabels.push(labels[i]);
      filteredShallow.push(shallow[i] ?? 0);
      filteredDeep.push(deep[i] ?? 0);
      filteredMoisture.push(moisture[i] ?? 0);
    }

    return {
      labels: filteredLabels,
      shallowTemps: filteredShallow,
      deepTemps: filteredDeep,
      moisture: filteredMoisture,
      todayIndex
    };
  });

  public chartLabels = computed(() => this._filteredChartData().labels);
  public dailyAverageShallowTemps = computed(
    () => this._filteredChartData().shallowTemps
  );
  public dailyAverageDeepTemps = computed(
    () => this._filteredChartData().deepTemps
  );
  public dailyMoistureData = computed(() => this._filteredChartData().moisture);
  public todayIndex = computed(() => this._filteredChartData().todayIndex);

  public isLoadingAveragesChartData = computed(() =>
    this._soilTemperatureService.rollingWeekDailyAverageSoilData.isLoading()
  );

  public tempUnit = computed(
    () => this._soilTemperatureService.temperatureUnit()!
  );

  public grassType = computed(
    () => this._settingsService.currentSettings()?.grassType ?? 'cool'
  );

  private _currentHourIndex = computed(() => {
    const hourly =
      this._soilTemperatureService.rollingWeekDailyAverageSoilData.value()
        ?.hourly;

    if (!hourly) return -1;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const nowLocal = `${year}-${month}-${day}T${hour}`;

    const index = hourly.time.findIndex((t) => t.startsWith(nowLocal));

    return index >= 0 ? index : 7 * HOURS_IN_A_DAY + now.getHours();
  });

  public currentShallowTemp = computed(() => {
    const hourly =
      this._soilTemperatureService.rollingWeekDailyAverageSoilData.value()
        ?.hourly.soil_temperature_6cm;

    if (!hourly) return null;

    const val = getMostRecentValue(hourly, this._currentHourIndex());

    return val !== null ? Math.round(val) : null;
  });

  public currentDeepTemp = computed(() => {
    const hourly =
      this._soilTemperatureService.rollingWeekDailyAverageSoilData.value()
        ?.hourly.soil_temperature_18cm;

    if (!hourly) return null;

    const val = getMostRecentValue(hourly, this._currentHourIndex());

    return val !== null ? Math.round(val) : null;
  });

  public currentMoisturePct = computed(() => {
    const hourly =
      this._soilTemperatureService.rollingWeekDailyAverageSoilData.value()
        ?.hourly.soil_moisture_3_to_9cm;

    if (!hourly) return null;

    const val = getMostRecentValue(hourly, this._currentHourIndex());

    return val !== null ? Math.round(val * 100) : null;
  });

  public tempTrend = computed(() => computeSoilTrend(this._rawShallowTemps()));

  public moistureTrend = computed(() =>
    computeSoilTrend(this._rawMoistureData())
  );

  public goToSettings(): void {
    this._router.navigate(['settings']);
  }
}
