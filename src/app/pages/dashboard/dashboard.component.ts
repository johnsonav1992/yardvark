import { Component, computed, inject } from '@angular/core';
import { PageContainerComponent } from '../../components/layout/page-container/page-container.component';
import { RecentEntryComponent } from '../../components/dashboard/recent-entry/recent-entry.component';
import { EntriesService } from '../../services/entries.service';
import { LoadingSpinnerComponent } from '../../components/miscellanious/loading-spinner/loading-spinner.component';
import { MessageModule } from 'primeng/message';
import { injectUserData } from '../../utils/authUtils';
import { YVUser } from '../../types/user.types';
import { isToday } from 'date-fns';
import { SpeedDialModule } from 'primeng/speeddial';
import { MenuItem } from 'primeng/api';
import { GlobalUiService } from '../../services/global-ui.service';
import { Router } from '@angular/router';
import { LocationService } from '../../services/location.service';
import { SettingsService } from '../../services/settings.service';
import { QuickStatsComponent } from '../../components/dashboard/quick-stats/quick-stats.component';
import { WeatherService } from '../../services/weather-service';

@Component({
	selector: 'dashboard',
	imports: [
		PageContainerComponent,
		RecentEntryComponent,
		LoadingSpinnerComponent,
		MessageModule,
		SpeedDialModule,
		QuickStatsComponent,
	],
	templateUrl: './dashboard.component.html',
	styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
	private _entriesService = inject(EntriesService);
	private _globalUiService = inject(GlobalUiService);
	private _router = inject(Router);
	private _locationService = inject(LocationService);
	private _settingsService = inject(SettingsService);

	public user = injectUserData();
	public isMobile = this._globalUiService.isMobile;

	public constructor() {
		inject(WeatherService);
	}

	public isLocationLoading = computed(() =>
		this._settingsService.settings.isLoading(),
	);
	public userHasALocation = computed(
		() => !!this._locationService.userLatLong(),
	);

	public userIsNewWithNoEntries = computed(() => {
		const user = this.user() as YVUser;

		return (
			isToday(user['https://yardvark.netlify.app/signup-date']) &&
			!this.recentEntry.value()
		);
	});

	public recentEntry = this._entriesService.recentEntry;

	public mobileSpeedDialMenu = computed<MenuItem[]>(() => [
		{
			label: 'Create entry',
			tooltip: 'Create entry',
			icon: 'ti ti-notebook',
			style: {
				width: this.isMobile() ? '4rem' : '70px',
				height: this.isMobile() ? '4rem' : '70px',
			},
			command: () => {
				this._router.navigate(['entry-log'], { queryParams: { create: true } });
			},
		},
	]);
}
