import { Component, computed, inject } from '@angular/core';
import { PageContainerComponent } from '../../components/layout/page-container/page-container.component';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { GlobalUiService } from '../../services/global-ui.service';
import { getMonthlyMowingChartConfig } from '../../utils/analyticsUtils';
import { AnalyticsService } from '../../services/analytics.service';

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
    const uiOptions = {
      isDarkMode: this.isDarkMode(),
      isMobile: this.isMobile()
    };

    return [getMonthlyMowingChartConfig(this.analyticsData.value(), uiOptions)];
  });
}
