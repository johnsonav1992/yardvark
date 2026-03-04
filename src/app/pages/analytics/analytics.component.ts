import { Component, computed, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { getYear } from "date-fns";
import { CardModule } from "primeng/card";
import { ChartModule } from "primeng/chart";
import { DatePickerModule } from "primeng/datepicker";
import { FloatLabelModule } from "primeng/floatlabel";
import { PopoverModule } from "primeng/popover";
import { SkeletonModule } from "primeng/skeleton";
import { PageContainerComponent } from "../../components/layout/page-container/page-container.component";
import { EmptyMessageComponent } from "../../components/miscellanious/empty-message/empty-message.component";
import { UpgradePromptComponent } from "../../components/subscription/upgrade-prompt/upgrade-prompt.component";
import { AnalyticsService } from "../../services/analytics.service";
import { GlobalUiService } from "../../services/global-ui.service";
import { SubscriptionService } from "../../services/subscription.service";
import {
	getAverageDaysBetweenChartConfig,
	getFertilizerTimelineChartConfig,
	getMonthlyMowingChartConfig,
	getProductTypeDistributionChartConfig,
} from "../../utils/analyticsUtils";

@Component({
	selector: "analytics",
	imports: [
		PageContainerComponent,
		CardModule,
		ChartModule,
		EmptyMessageComponent,
		DatePickerModule,
		FormsModule,
		FloatLabelModule,
		PopoverModule,
		UpgradePromptComponent,
		SkeletonModule,
	],
	templateUrl: "./analytics.component.html",
	styleUrl: "./analytics.component.scss",
})
export class AnalyticsComponent {
	private _globalUiService = inject(GlobalUiService);
	private _analyticsService = inject(AnalyticsService);
	private _subscriptionService = inject(SubscriptionService);

	public analyticsData = this._analyticsService.analyticsData;

	public isDarkMode = this._globalUiService.isDarkMode;
	public isMobile = this._globalUiService.isMobile;
	public isPro = this._subscriptionService.isPro;

	public year = this._analyticsService.year;
	public yearDate = computed(() => new Date(this.year(), 0, 1));

	public charts = computed(() => {
		const uiOptions = {
			isDarkMode: this.isDarkMode(),
			isMobile: this.isMobile(),
		};

		const allCharts = [
			getMonthlyMowingChartConfig(this.analyticsData.value(), uiOptions),
			getAverageDaysBetweenChartConfig(this.analyticsData.value(), uiOptions),
			getFertilizerTimelineChartConfig(this.analyticsData.value(), uiOptions),
			getProductTypeDistributionChartConfig(this.analyticsData.value()),
		];

		if (!this.isPro()) {
			return [allCharts[0]];
		}

		return allCharts;
	});

	public hasAnyData = computed(() => {
		return this.charts().some(
			(chart) => (chart.chartData.datasets?.[0]?.data?.length ?? 0) > 0,
		);
	});

	public onYearChange(date: Date): void {
		this._analyticsService.year.set(getYear(date));
	}
}
