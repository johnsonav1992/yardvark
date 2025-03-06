import { Component, computed, input } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { ChartModule } from 'primeng/chart';
import { getFullWeekOfDayLabelsCenteredAroundCurrentDay } from '../../utils/timeUtils';
import { getSoilTemperatureDisplayColor } from '../../utils/soilTemperatureUtils';
import { OpenMeteoQueryParams } from '../../types/openmeteo.types';

@Component({
  selector: 'soil-temp-week-graph',
  imports: [ChartModule],
  templateUrl: './soil-temp-week-graph.component.html',
  styleUrl: './soil-temp-week-graph.component.scss',
})
export class SoilTempWeekGraphComponent {
  public dailyAverageTemps = input.required<number[]>();
  public tempUnit =
    input.required<NonNullable<OpenMeteoQueryParams['temperature_unit']>>();
  public isLoadingChartData = input<boolean>(false);

  public data = computed<ChartData<'line'>>(() => {
    const averageOfAverages =
      this.dailyAverageTemps().reduce((acc, curr) => acc + curr, 0) / 7;

    return {
      labels: getFullWeekOfDayLabelsCenteredAroundCurrentDay(),
      datasets: [
        {
          type: 'line',
          label: `Temperature ${this.tempUnit() === 'fahrenheit' ? '°F' : '°C'}`,
          data: this.dailyAverageTemps(),
          fill: true,
          borderColor: getSoilTemperatureDisplayColor(averageOfAverages),
          backgroundColor:
            getSoilTemperatureDisplayColor(averageOfAverages) + '65',
          tension: 0.4,
        },
      ],
    };
  });

  public options: ChartOptions<'line'> = {
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        max: 110,
        ticks: {
          stepSize: 10,
        },
      },
    },
  };
}
