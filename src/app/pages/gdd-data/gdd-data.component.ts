import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { ChartModule } from 'primeng/chart';
import { PageContainerComponent } from '../../components/layout/page-container/page-container.component';
import { GddService } from '../../services/gdd.service';
import { LocationService } from '../../services/location.service';
import { GlobalUiService } from '../../services/global-ui.service';
import { getGddForecastChartConfig } from '../../utils/gddChartUtils';

@Component({
  selector: 'gdd-data',
  imports: [
    PageContainerComponent,
    CardModule,
    ButtonModule,
    ProgressBarModule,
    ChartModule
  ],
  templateUrl: './gdd-data.component.html',
  styleUrl: './gdd-data.component.scss'
})
export class GddDataComponent {
  private _gddService = inject(GddService);
  private _locationService = inject(LocationService);
  private _router = inject(Router);
  private _globalUiService = inject(GlobalUiService);

  public isMobile = this._globalUiService.isMobile;
  public isDarkMode = this._globalUiService.isDarkMode;

  public userHasALocation = computed(
    () => !!this._locationService.userLatLong()
  );

  public currentGddData = this._gddService.currentGdd;
  public forecastData = this._gddService.gddForecast;

  public isLoading = computed(
    () => this.currentGddData.isLoading() || this.forecastData.isLoading()
  );

  public accumulatedGdd = computed(
    () => this.currentGddData.value()?.accumulatedGdd ?? 0
  );

  public targetGdd = computed(
    () => this.currentGddData.value()?.targetGdd ?? 200
  );

  public percentageToTarget = computed(
    () => this.currentGddData.value()?.percentageToTarget ?? 0
  );

  public lastPgrAppDate = computed(
    () => this.currentGddData.value()?.lastPgrAppDate
  );

  public daysSinceLastApp = computed(
    () => this.currentGddData.value()?.daysSinceLastApp
  );

  public grassType = computed(() => this.currentGddData.value()?.grassType);

  public baseTemperature = computed(
    () => this.currentGddData.value()?.baseTemperature
  );

  public temperatureUnit = computed(
    () => this.currentGddData.value()?.baseTemperatureUnit
  );

  public projectedNextAppDate = computed(
    () => this.forecastData.value()?.projectedNextAppDate
  );

  public daysUntilTarget = computed(
    () => this.forecastData.value()?.daysUntilTarget
  );

  public forecastChartConfig = computed(() =>
    getGddForecastChartConfig(this.forecastData.value(), {
      isDarkMode: this.isDarkMode(),
      isMobile: this.isMobile()
    })
  );

  public goToSettings(): void {
    this._router.navigate(['settings']);
  }
}
