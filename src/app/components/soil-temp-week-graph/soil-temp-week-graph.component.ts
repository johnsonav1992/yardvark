import { Component, computed, input } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { ChartModule } from 'primeng/chart';
import { getFullWeekOfDayLabelsCenteredAroundCurrentDay } from '../../utils/timeUtils';
import { OpenMeteoQueryParams } from '../../types/openmeteo.types';
import { getPrimeNgHexColor } from '../../utils/styleUtils';

@Component({
  selector: 'soil-temp-week-graph',
  imports: [ChartModule],
  templateUrl: './soil-temp-week-graph.component.html',
  styleUrl: './soil-temp-week-graph.component.scss',
})
export class SoilTempWeekGraphComponent {
  public dailyAverageShallowTemps = input.required<number[]>();
  public dailyAverageDeepTemps = input.required<number[]>();
  public tempUnit =
    input.required<NonNullable<OpenMeteoQueryParams['temperature_unit']>>();
  public isLoadingChartData = input<boolean>(false);

  public displayTempUnit = computed(
    () => `${this.tempUnit() === 'fahrenheit' ? '°F' : '°C'}`,
  );

  public tempsChartData = computed<ChartData<'line'>>(() => ({
    labels: getFullWeekOfDayLabelsCenteredAroundCurrentDay(),
    datasets: [
      {
        type: 'line',
        label: `3in. Depth ${this.displayTempUnit()}`,
        data: this.dailyAverageShallowTemps(),
        borderColor: getPrimeNgHexColor('indigo.400'),
        tension: 0.4,
      },
      {
        type: 'line',
        label: `7in. depth ${this.displayTempUnit()}`,
        data: this.dailyAverageDeepTemps(),
        borderColor: getPrimeNgHexColor('lime.400'),
        tension: 0.4,
      },
    ],
  }));

  public options: ChartOptions<'line'> = {
    maintainAspectRatio: false,
    aspectRatio: 0.75,
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
    plugins: {
      legend: {
        position: 'chartArea',
        align: 'end',
      },
    },
  };
}
