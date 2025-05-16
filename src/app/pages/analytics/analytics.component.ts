import { Component, computed, inject } from '@angular/core';
import { PageContainerComponent } from '../../components/layout/page-container/page-container.component';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { GlobalUiService } from '../../services/global-ui.service';
import { getMonthAbbreviationsFromSeasonStartToToday } from '../../utils/analyticsUtils';
import { AnalyticsService } from '../../services/analytics.service';
import { effectSignalLogger } from '../../utils/generalUtils';

@Component({
  selector: 'analytics',
  imports: [PageContainerComponent, CardModule, ChartModule],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss'
})
export class AnalyticsComponent {
  private _globalUiService = inject(GlobalUiService);
  private _analyticsService = inject(AnalyticsService);

  public analyticsData = this._analyticsService.analyticsData;

  public isDarkMode = this._globalUiService.isDarkMode;
  public isMobile = this._globalUiService.isMobile;

  public charts = computed(() => {
    const mowingCounts =
      this.analyticsData
        .value()
        ?.mowingAnalyticsData.map((month) => +month.mowCount) || [];

    const highestMowingCount = Math.max(...mowingCounts);

    return [
      {
        title: `Monthly Mow Counts (${new Date().getFullYear()})`,
        chartData: {
          labels: getMonthAbbreviationsFromSeasonStartToToday(),
          datasets: [
            {
              type: 'bar' as const,
              label: `Mowing Count`,
              data: mowingCounts
            }
          ]
        },
        options: {
          maintainAspectRatio: false,
          aspectRatio: 0.75,
          scales: {
            y: {
              beginAtZero: true,
              min: 0,
              max: highestMowingCount * 1.25,
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
          }
          // plugins: {
          //   legend: {
          //     position: 'chartArea',
          //     align: 'start'
          //   }
          // }
        }
      }
    ];
  });
}
