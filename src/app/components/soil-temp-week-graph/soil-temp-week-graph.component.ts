import { Component, computed, input } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { ChartModule } from 'primeng/chart';
import { daysOfWeek } from '../../utils/timeUtils';
import { getSoilTemperatureDisplayColor } from '../../utils/soilTemperatureUtils';

@Component({
  selector: 'soil-temp-week-graph',
  imports: [ChartModule],
  templateUrl: './soil-temp-week-graph.component.html',
  styleUrl: './soil-temp-week-graph.component.scss',
})
export class SoilTempWeekGraphComponent {
  public dailyAverageTemps = input.required<number[]>();

  public data = computed<ChartData>(() => {
    const today = new Date();
    const todayIndex = today.getDay();
    const labels = [];

    for (let i = -3; i <= 3; i++) {
      const dayIndex = (todayIndex + i + 7) % 7;
      labels.push(daysOfWeek[dayIndex]);
    }

    const averageOfAverages =
      this.dailyAverageTemps().reduce((acc, curr) => acc + curr, 0) / 7;

    return {
      labels: labels,
      datasets: [
        {
          type: 'line',
          label: 'Temperature',
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

  public options: ChartOptions = {
    scales: {
      y: { beginAtZero: true },
    },
  };
}
