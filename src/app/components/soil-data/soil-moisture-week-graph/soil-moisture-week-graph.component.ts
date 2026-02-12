import { Component, computed, inject, input } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { getPrimeNgHexColor } from '../../../utils/styleUtils';
import { ChartLoaderComponent } from '../../miscellanious/chart-loader/chart-loader.component';
import { ChartModule } from 'primeng/chart';
import { GlobalUiService } from '../../../services/global-ui.service';
import { DARK_MODE_CHART_GRID_COLOR } from '../../../constants/chart-constants';
import { CardModule } from 'primeng/card';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'soil-moisture-week-graph',
  imports: [
    ChartLoaderComponent,
    ChartModule,
    CardModule,
    NgTemplateOutlet
  ],
  templateUrl: './soil-moisture-week-graph.component.html',
  styleUrl: './soil-moisture-week-graph.component.scss'
})
export class SoilMoistureWeekGraphComponent {
  private _globalUiService = inject(GlobalUiService);

  public isMobile = this._globalUiService.isMobile;
  public isDarkMode = this._globalUiService.isDarkMode;

  public labels = input.required<string[]>();
  public dailyMoistureData = input.required<number[]>();
  public isLoadingChartData = input<boolean>(false);
  public todayIndex = input<number>(-1);

  public moistureChartData = computed<ChartData<'line'>>(() => ({
    labels: this.labels(),
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
    aspectRatio: this.isMobile() ? 1.1 : 0.75,
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
              color: DARK_MODE_CHART_GRID_COLOR
            }
          : undefined
      },
      x: {
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
      },
      annotation: {
        annotations:
          this.todayIndex() >= 0
            ? {
                todayLine: {
                  type: 'line',
                  xMin: this.todayIndex(),
                  xMax: this.todayIndex(),
                  borderColor: this.isDarkMode()
                    ? 'rgba(156, 163, 175, 0.6)'
                    : 'rgba(107, 114, 128, 0.5)',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  label: {
                    display: false
                  }
                }
              }
            : {}
      }
    }
  }));
}
