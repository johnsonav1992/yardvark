import { Component, computed, inject, signal } from '@angular/core';
import { PageContainerComponent } from '../../components/layout/page-container/page-container.component';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { GlobalUiService } from '../../services/global-ui.service';
import {
	getFertilizerTimelineChartConfig,
	getMonthlyMowingChartConfig,
	getProductTypeDistributionChartConfig
} from '../../utils/analyticsUtils';
import { AnalyticsService } from '../../services/analytics.service';
import { EmptyMessageComponent } from '../../components/miscellanious/empty-message/empty-message.component';
import { LoadingSpinnerComponent } from '../../components/miscellanious/loading-spinner/loading-spinner.component';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { PopoverModule } from 'primeng/popover';

@Component({
	selector: 'analytics',
	imports: [
		PageContainerComponent,
		CardModule,
		ChartModule,
		EmptyMessageComponent,
		LoadingSpinnerComponent,
		DatePickerModule,
		FormsModule,
		FloatLabelModule,
		PopoverModule
	],
	templateUrl: './analytics.component.html',
	styleUrl: './analytics.component.scss'
})
export class AnalyticsComponent {
	private _globalUiService = inject(GlobalUiService);
	private _analyticsService = inject(AnalyticsService);

	public analyticsData = this._analyticsService.analyticsData;

	public isDarkMode = this._globalUiService.isDarkMode;
	public isMobile = this._globalUiService.isMobile;

	public year = signal(new Date());

	public charts = computed(() => {
		const uiOptions = {
			isDarkMode: this.isDarkMode(),
			isMobile: this.isMobile()
		};

		return [
			getMonthlyMowingChartConfig(this.analyticsData.value(), uiOptions),
			getFertilizerTimelineChartConfig(this.analyticsData.value(), uiOptions),
			getProductTypeDistributionChartConfig(this.analyticsData.value())
		];
	});
}
