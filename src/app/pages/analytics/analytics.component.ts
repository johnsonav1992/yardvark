import { Component, computed, inject } from '@angular/core';
import { PageContainerComponent } from '../../components/layout/page-container/page-container.component';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { GlobalUiService } from '../../services/global-ui.service';
import { getMonthAbbreviationsFromSeasonStartToToday } from '../../utils/analyticsUtils';

@Component({
  selector: 'analytics',
  imports: [PageContainerComponent, CardModule, ChartModule],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss'
})
export class AnalyticsComponent {
  private _globalUiService = inject(GlobalUiService);

  public isDarkMode = this._globalUiService.isDarkMode;

  public charts = computed(() => {
    return [
      {
        title: 'Mowing Frequency Over Time',
        chartData: {
          labels: getMonthAbbreviationsFromSeasonStartToToday(),
          datasets: [
            {
              type: 'line' as const,
              label: `Mowing Frequency`,
              data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
              borderColor: 'red',
              tension: 0.4
            }
          ]
        },
        options: {
          maintainAspectRatio: false,
          aspectRatio: 0.75,
          scales: {
            y: {
              beginAtZero: true,
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
        }
      }
    ];
  });
}
