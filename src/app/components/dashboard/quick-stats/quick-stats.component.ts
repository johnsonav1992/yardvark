import { Component, computed, inject, output } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { EntriesService } from '../../../services/entries.service';
import { differenceInDays, parseISO } from 'date-fns';
import { getLawnSeasonCompletedPercentageWithTemp } from '../../../utils/lawnSeasonUtils';
import { ProgressBarModule } from 'primeng/progressbar';
import { DividerModule } from 'primeng/divider';
import { DividerDesignTokens } from '@primeuix/themes/types/divider';
import { GlobalUiService } from '../../../services/global-ui.service';
import { LocationService } from '../../../services/location.service';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { SoilTemperatureService } from '../../../services/soil-temperature.service';
import { calculate24HourNumericAverage } from '../../../utils/soilTemperatureUtils';
import { GddService } from '../../../services/gdd.service';
import { SubscriptionService } from '../../../services/subscription.service';

@Component({
  selector: 'quick-stats',
  imports: [
    CardModule,
    ButtonModule,
    TooltipModule,
    ProgressBarModule,
    DividerModule,
    CdkDragHandle
  ],
  templateUrl: './quick-stats.component.html',
  styleUrl: './quick-stats.component.scss'
})
export class QuickStatsComponent {
  private _entriesService = inject(EntriesService);
  private _locationService = inject(LocationService);
  private _globalUiService = inject(GlobalUiService);
  private _soilTempService = inject(SoilTemperatureService);
  private _gddService = inject(GddService);
  private _subscriptionService = inject(SubscriptionService);

  public isMobile = this._globalUiService.isMobile;
  public isPro = this._subscriptionService.isPro;

  public onHideWidget = output<void>();

  public lastMowDate = this._entriesService.lastMow;
  public lastEntry = this._entriesService.recentEntry;
  public userCoords = this._locationService.userLatLong;
  public past24HourSoilData =
    this._soilTempService.past24HourSoilTemperatureData;
  public temperatureUnit = this._soilTempService.temperatureUnit;

  public isLoading = computed(
    () =>
      this.lastMowDate.isLoading() ||
      this.lastEntry.isLoading() ||
      this._entriesService.lastProductApp.isLoading()
  );

  public daysSinceLastMow = computed(() => {
    const lastMowDate = this.lastMowDate.value()?.lastMowDate;

    if (!lastMowDate) return 'N/A';

    const now = new Date();
    const daysSince = differenceInDays(now, parseISO(lastMowDate.toString()));

    return daysSince ?? 'N/A';
  });

  public daysSinceLastEntry = computed(() => {
    const lastEntry = this.lastEntry.value();

    if (!lastEntry) return 'N/A';

    const now = new Date();
    const daysSince = differenceInDays(now, parseISO(lastEntry.date.toString()));

    return daysSince ?? 'N/A';
  });

  public daysSinceLastProductApplication = computed(() => {
    const lastProductAppDate =
      this._entriesService.lastProductApp.value()?.lastProductAppDate;

    if (!lastProductAppDate) return 'N/A';

    const now = new Date();
    const daysSince = differenceInDays(
      now,
      parseISO(lastProductAppDate.toString())
    );

    return daysSince ?? 'N/A';
  });

  public currentSoilTemp = computed(() => {
    const soilData = this.past24HourSoilData.value();
    if (!soilData?.hourly?.soil_temperature_6cm) return null;

    return calculate24HourNumericAverage(soilData.hourly.soil_temperature_6cm);
  });

  public lawnSeasonPercentage = computed(() => {
    const coords = this.userCoords();

    if (!coords) return null;

    const currentTemp = this.currentSoilTemp();
    const tempUnit = this.temperatureUnit();

    const progressPercentage = getLawnSeasonCompletedPercentageWithTemp(
      coords,
      currentTemp,
      tempUnit
    );

    if (progressPercentage < 0 || progressPercentage > 100) {
      return null;
    }

    return progressPercentage;
  });

  public currentGddData = this._gddService.currentGdd;

  public hasGddData = computed(() => {
    const data = this.currentGddData.value();
    return data && data.lastPgrAppDate !== null;
  });

  public gddCycleStatus = computed(
    () => this.currentGddData.value()?.cycleStatus ?? 'active'
  );

  public isGddDormant = computed(() => this.gddCycleStatus() === 'dormant');
  public isGddOverdue = computed(() => this.gddCycleStatus() === 'overdue');
  public isGddComplete = computed(() => this.gddCycleStatus() === 'complete');

  public gddAccumulated = computed(
    () => this.currentGddData.value()?.accumulatedGdd ?? 0
  );

  public gddTarget = computed(
    () => this.currentGddData.value()?.targetGdd ?? 200
  );

  public gddPercentage = computed(
    () => this.currentGddData.value()?.percentageToTarget ?? 0
  );

  public dividerDt: DividerDesignTokens = {
    horizontal: {
      margin: 'none'
    }
  };

  public hideWidget(): void {
    this.onHideWidget.emit();
  }
}
