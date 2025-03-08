import { Component, computed, input } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { getFullWeekOfDayLabelsCenteredAroundCurrentDay } from '../../../utils/timeUtils';
import { getPrimeNgHexColor } from '../../../utils/styleUtils';
import { ChartLoaderComponent } from '../../chart-loader/chart-loader.component';
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'soil-moisture-week-graph',
  imports: [ChartLoaderComponent, ChartModule],
  templateUrl: './soil-moisture-week-graph.component.html',
  styleUrl: './soil-moisture-week-graph.component.scss'
})
export class SoilMoistureWeekGraphComponent {
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

  public options: ChartOptions<'line'> = {
    maintainAspectRatio: false,
    aspectRatio: 0.75,
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        max: 0.8,
        ticks: {
          stepSize: 0.1
        }
      }
    },
    plugins: {
      legend: {
        position: 'chartArea',
        align: 'end'
      }
    }
  };
}
