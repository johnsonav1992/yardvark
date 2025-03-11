import { Component, computed, input } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { getFullWeekOfDayLabelsCenteredAroundCurrentDay } from '../../../utils/timeUtils';
import { getPrimeNgHexColor } from '../../../utils/styleUtils';
import { ChartLoaderComponent } from '../../chart-loader/chart-loader.component';
import { ChartModule } from 'primeng/chart';
import { PopoverModule } from 'primeng/popover';

@Component({
  selector: 'soil-moisture-week-graph',
  imports: [ChartLoaderComponent, ChartModule, PopoverModule],
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
        max: 50,
        ticks: {
          stepSize: 10,
          callback: (val) => `${val}%`
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
