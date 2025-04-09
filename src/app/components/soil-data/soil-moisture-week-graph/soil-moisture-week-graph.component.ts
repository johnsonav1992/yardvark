import { Component, computed, inject, input } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { getFullWeekOfDayLabelsCenteredAroundCurrentDay } from '../../../utils/timeUtils';
import { getPrimeNgHexColor } from '../../../utils/styleUtils';
import { ChartLoaderComponent } from '../../chart-loader/chart-loader.component';
import { ChartModule } from 'primeng/chart';
import { PopoverModule } from 'primeng/popover';
import { GlobalUiService } from '../../../services/global-ui.service';

@Component({
  selector: 'soil-moisture-week-graph',
  imports: [ChartLoaderComponent, ChartModule, PopoverModule],
  templateUrl: './soil-moisture-week-graph.component.html',
  styleUrl: './soil-moisture-week-graph.component.scss'
})
export class SoilMoistureWeekGraphComponent {
  private _globalUiService = inject(GlobalUiService);

  public isMobile = this._globalUiService.isMobile;
  public isDarkMode = this._globalUiService.isDarkMode;

  public dailyMoistureData = input.required<number[]>();
  public isLoadingChartData = input<boolean>(false);

  public moistureChartData = computed<ChartData<'line'>>(() => ({
    labels: getFullWeekOfDayLabelsCenteredAroundCurrentDay({
      includeDates: true,
      shortDayNames: true
    }),
    datasets: [
      {
        type: 'line',
        label: 'Soil moisture',
        data: this.dailyMoistureData(),
        borderColor: getPrimeNgHexColor('rose.400'),
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
        max: 50,
        ticks: {
          stepSize: 10,
          callback: (val) => `${val}%`
        },
        grid: this.isDarkMode()
          ? {
              color: 'rgba(200, 200, 200, 0.2)'
            }
          : undefined
      },
      x: {
        grid: this.isDarkMode()
          ? {
              color: 'rgba(200, 200, 200, 0.2)'
            }
          : undefined
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
