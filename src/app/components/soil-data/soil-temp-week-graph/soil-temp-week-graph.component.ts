import { Component, computed, inject, input } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { ChartModule } from 'primeng/chart';
import { getFullWeekOfDayLabelsCenteredAroundCurrentDay } from '../../../utils/timeUtils';
import { OpenMeteoQueryParams } from '../../../types/openmeteo.types';
import { getPrimeNgHexColor } from '../../../utils/styleUtils';
import { ChartLoaderComponent } from '../../miscellanious/chart-loader/chart-loader.component';
import { GlobalUiService } from '../../../services/global-ui.service';
import { getChartGridLineColors } from '../../../utils/chartUtils';
import { DARK_MODE_CHART_GRID_COLOR } from '../../../constants/chart-constants';

@Component({
  selector: 'soil-temp-week-graph',
  imports: [ChartModule, ChartLoaderComponent],
  templateUrl: './soil-temp-week-graph.component.html',
  styleUrl: './soil-temp-week-graph.component.scss'
})
export class SoilTempWeekGraphComponent {
  private _globalUiService = inject(GlobalUiService);

  public isDarkMode = this._globalUiService.isDarkMode;
  public isMobile = this._globalUiService.isMobile;

  public dailyAverageShallowTemps = input.required<number[]>();
  public dailyAverageDeepTemps = input.required<number[]>();
  public tempUnit =
    input.required<NonNullable<OpenMeteoQueryParams['temperature_unit']>>();
  public isLoadingChartData = input<boolean>(false);

  public displayTempUnit = computed(
    () => `${this.tempUnit() === 'fahrenheit' ? '°F' : '°C'}`
  );

  public tempsChartData = computed<ChartData<'line'>>(() => ({
    labels: getFullWeekOfDayLabelsCenteredAroundCurrentDay({
      includeDates: true,
      tinyDayNames: this.isMobile(),
      shortDayNames: !this.isMobile()
    }),
    datasets: [
      {
        type: 'line',
        label: `3in. depth ${this.displayTempUnit()}`,
        data: this.dailyAverageShallowTemps(),
        borderColor: getPrimeNgHexColor('indigo.400'),
        tension: 0.4
      },
      {
        type: 'line',
        label: `7in. depth ${this.displayTempUnit()}`,
        data: this.dailyAverageDeepTemps(),
        borderColor: getPrimeNgHexColor('lime.400'),
        tension: 0.4
      }
    ]
  }));

  public options = computed<ChartOptions<'line'>>(() => ({
    maintainAspectRatio: false,
    aspectRatio: 0.75,
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20
        },
        grid: this.isDarkMode()
          ? {
              color: DARK_MODE_CHART_GRID_COLOR
            }
          : undefined
      },
      x: {
        grid: {
          color: (context) =>
            getChartGridLineColors(
              context,
              this.isDarkMode() ? 'dark' : 'light'
            )
        },
        ticks: {
          maxRotation: this.isMobile() ? 25 : 0,
          minRotation: this.isMobile() ? 25 : 0
        }
      }
    },
    plugins: {
      legend: {
        position: 'chartArea',
        align: 'end'
      }
    }
  }));
}
