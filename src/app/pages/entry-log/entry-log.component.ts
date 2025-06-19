import {
	Component,
	computed,
	inject,
	linkedSignal,
	OnInit,
	signal
} from '@angular/core';
import {
	CalendarMarkerData,
	DaySelectedEvent,
	EntriesCalendarComponent
} from '../../components/entries/entries-calendar/entries-calendar.component';
import { ButtonModule } from 'primeng/button';
import { ButtonDesignTokens } from '@primeng/themes/types/button';
import { injectUserData } from '../../utils/authUtils';
import { Entry } from '../../types/entries.types';
import { getEntryIcon } from '../../utils/entriesUtils';
import { TooltipModule } from 'primeng/tooltip';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { DialogService } from 'primeng/dynamicdialog';
import { EntryDialogComponent } from '../../components/entries/entry-dialog/entry-dialog.component';
import { EntryDialogFooterComponent } from '../../components/entries/entry-dialog/entry-dialog-footer/entry-dialog-footer.component';
import { EntriesService } from '../../services/entries.service';
import { GlobalUiService } from '../../services/global-ui.service';
import { DividerModule } from 'primeng/divider';
import { format, isSameDay } from 'date-fns';
import { CardModule } from 'primeng/card';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { convertTimeStringToDate } from '../../utils/timeUtils';
import { MobileEntryPreviewCardComponent } from '../../components/entries/mobile-entry-preview-card/mobile-entry-preview-card.component';
import { SettingsService } from '../../services/settings.service';
import { SettingsData } from '../../../../backend/src/modules/settings/models/settings.types';
import { WeatherService } from '../../services/weather-service';
import { DailyWeatherCalendarForecast } from '../../types/weather.types';
import { getForecastMarkerIcon } from '../../utils/weatherUtils';
import { WeatherDayMarker } from '../../components/weather/weather-day-marker/weather-day-marker';

@Component({
	selector: 'entry-log',
	imports: [
		EntriesCalendarComponent,
		ButtonModule,
		TooltipModule,
		RouterOutlet,
		DividerModule,
		CardModule,
		MobileEntryPreviewCardComponent,
		WeatherDayMarker
	],
	templateUrl: './entry-log.component.html',
	styleUrl: './entry-log.component.scss',
	providers: [DialogService]
})
export class EntryLogComponent implements OnInit {
	private _router = inject(Router);
	private _activatedRoute = inject(ActivatedRoute);
	private _dialogService = inject(DialogService);
	private _entriesService = inject(EntriesService);
	private _globalUiService = inject(GlobalUiService);
	private _settingsService = inject(SettingsService);
	private _weatherService = inject(WeatherService);

	public isCreateOnOpen = toSignal(
		this._activatedRoute.queryParams.pipe(
			map((params) => params['create'] === 'true')
		)
	);

	public directDateNavigation = toSignal(
		this._activatedRoute.queryParams.pipe(
			map((params) => {
				const date = params['date'];

				if (date) {
					const parsedDate = new Date(date);

					if (!isNaN(parsedDate.getTime())) {
						return parsedDate;
					}
				}

				return null;
			})
		),
		{
			initialValue: null
		}
	);

	public isMobile = this._globalUiService.isMobile;
	public darkMode = this._globalUiService.isDarkMode;

	public user = injectUserData();

	public currentDate = signal(new Date());
	public selectedMobileDateToView = signal<Date | null>(null);
	public viewMode = linkedSignal<SettingsData | undefined, 'calendar' | 'list'>(
		{
			source: this._settingsService.currentSettings,
			computation: (settings) => settings?.entryView || 'calendar'
		}
	);

	public selectedMobileDateEntries = linkedSignal({
		source: this.selectedMobileDateToView,
		computation: (newMobileDateToView) => {
			if (newMobileDateToView) {
				return this.entries
					.value()
					?.filter((entry) =>
						isSameDay(new Date(entry.date), newMobileDateToView)
					)
					.map((entry) => {
						const time = entry.time
							? (convertTimeStringToDate(entry.time) as Date)
							: '';

						return {
							...entry,
							time: time ? format(time, 'hh:mm a') : ''
						};
					});
			}

			return null;
		}
	});

	public entryMarkers = computed<
		CalendarMarkerData<{
			entry: Entry;
		}>[]
	>(() => {
		const currentMonthEntries = this.entries.value() || [];

		return currentMonthEntries.map((entry) => {
			const icon = getEntryIcon(entry);

			return {
				id: crypto.randomUUID(),
				date: new Date(entry.date),
				icon,
				data: { entry }
			};
		});
	});

	public weatherMarkers = computed<
		CalendarMarkerData<{
			forecast: DailyWeatherCalendarForecast;
		}>[]
	>(() => {
		const weatherForecasts = this._weatherService.dailyWeatherForecasts();

		return weatherForecasts.map((forecast) => ({
			id: crypto.randomUUID(),
			date: forecast.date,
			icon: getForecastMarkerIcon(forecast),
			data: { forecast }
		}));
	});

	public entries = this._entriesService.getMonthEntriesResource(
		this.currentDate
	);

	public listViewEntries = linkedSignal({
		source: this.entries.value,
		computation: (entries) => {
			if (entries) {
				return entries.map((entry) => {
					const time = entry.time
						? (convertTimeStringToDate(entry.time) as Date)
						: '';
					return {
						...entry,
						time: time ? format(time, 'hh:mm a') : ''
					};
				});
			}
			return null;
		}
	});

	public ngOnInit(): void {
		if (this.isCreateOnOpen()) {
			this.createEntry();
		}

		if (this.directDateNavigation()) {
			this.changeMonths(this.directDateNavigation()!);

			if (this.isMobile()) {
				this.selectedMobileDateToView.set(this.directDateNavigation()!);
			}
		}
	}

	public navigateToEntry(entry: Entry): void {
		this._router.navigate(['entry-log', entry.id], {
			state: {
				...entry,
				time: this.entries.value()?.find((e) => e.id === entry.id)?.time
			},
			queryParams: { date: new Date(entry.date).toISOString() }
		});
	}

	public changeMonths(newDate: Date): void {
		this.currentDate.set(newDate);
		this.selectedMobileDateToView.set(null);
	}

	public createEntry(date?: Date): void {
		const dialogRef = this._dialogService.open(EntryDialogComponent, {
			header: 'Add Entry',
			modal: true,
			focusOnShow: false,
			width: '50%',
			dismissableMask: true,
			closable: true,
			contentStyle: { overflow: 'auto' },
			inputValues: {
				date
			},
			templates: {
				footer: EntryDialogFooterComponent
			},
			breakpoints: {
				'800px': '95%'
			},
			maximizable: true
		});

		if (this.isMobile()) this._dialogService.getInstance(dialogRef).maximize();

		dialogRef.onClose.subscribe((result?: string) => {
			if (result) {
				this.changeMonths(new Date(result));

				if (this.isMobile())
					this.selectedMobileDateToView.set(new Date(result));

				this.entries.reload();
			}
		});
	}

	public selectDay(e: DaySelectedEvent): void {
		const { date, type } = e;

		if (this.isMobile() && type !== 'double-tap') {
			this.selectedMobileDateToView.set(date);
		} else {
			this.createEntry(date);
		}
	}

	public markerButtonDt: ButtonDesignTokens = {
		root: {
			iconOnlyWidth: '2rem'
		},
		colorScheme: {
			light: {
				root: {
					secondary: {
						background: '{primary.300}',
						borderColor: '{primary.300}',
						hoverBackground: '{primary.200}',
						hoverBorderColor: '{primary.200}',
						color: this.darkMode() ? '{surface.600}' : '',
						hoverColor: '{surface.600}'
					}
				}
			}
		}
	};

	public addButtonDt = computed<ButtonDesignTokens>(() => ({
		root: {
			iconOnlyWidth: this.isMobile() ? '4rem' : '5rem',
			lg: {
				fontSize: this.isMobile() ? '28px' : '36px',
				iconOnlyWidth: this.isMobile() ? '4rem' : '5rem'
			}
		}
	}));
}
