import { DatePipe, NgTemplateOutlet } from "@angular/common";
import {
	Component,
	computed,
	contentChild,
	inject,
	input,
	linkedSignal,
	model,
	output,
	signal,
	TemplateRef,
	viewChild,
} from "@angular/core";
import { addMonths, format, startOfToday, subMonths } from "date-fns";
import { getCalendarDaysData } from "./utils";
import { ButtonModule } from "primeng/button";
import { ActivatedRoute, Router } from "@angular/router";
import { map } from "rxjs";
import { toSignal } from "@angular/core/rxjs-interop";
import { GlobalUiService } from "../../../services/global-ui.service";
import { LoadingSpinnerComponent } from "../../miscellanious/loading-spinner/loading-spinner.component";
import { DoubleTapDirective } from "../../../directives/double-tap.directive";
import { SwipeDirective } from "../../../directives/swipe.directive";
import { EntrySearchSidebarComponent } from "../entry-search-sidebar/entry-search-sidebar.component";
import { CsvExportSidebarComponent } from "../csv-export-sidebar/csv-export-sidebar.component";
import { ButtonDesignTokens } from "@primeuix/themes/types/button";
import { MenuModule } from "primeng/menu";
import { FormsModule } from "@angular/forms";
import { MenuItem } from "primeng/api";
import { ToggleSwitchModule } from "primeng/toggleswitch";
import { SettingsService } from "../../../services/settings.service";
import { getSpecificDayOfMonth } from "../../../utils/timeUtils";
import { DatePickerModule } from "primeng/datepicker";

@Component({
	selector: "entries-calendar",
	templateUrl: "./entries-calendar.component.html",
	styleUrl: "./entries-calendar.component.scss",
	standalone: true,
	imports: [
		DatePipe,
		NgTemplateOutlet,
		ButtonModule,
		LoadingSpinnerComponent,
		DoubleTapDirective,
		SwipeDirective,
		EntrySearchSidebarComponent,
		CsvExportSidebarComponent,
		MenuModule,
		FormsModule,
		ToggleSwitchModule,
		DatePickerModule,
	],
})
export class EntriesCalendarComponent {
	private _router = inject(Router);
	private _route = inject(ActivatedRoute);
	private _globalUiService = inject(GlobalUiService);
	private _settingsService = inject(SettingsService);

	public isMobile = this._globalUiService.isMobile;
	public isDarkMode = this._globalUiService.isDarkMode;

	private _dateQuery = toSignal(
		this._router.routerState.root.queryParams.pipe(
			map((params) => params["date"] as string),
		),
	);

	public isLoadingData = input<boolean>(false);
	public markers = input<CalendarMarkerData[]>([]);
	public weatherMarkers = input<CalendarMarkerData[]>([]);
	public markerTpl =
		contentChild<TemplateRef<{ $implicit: CalendarMarkerData[] }>>("marker");
	public weatherMarkerTpl =
		contentChild<TemplateRef<{ $implicit: CalendarMarkerData[] }>>(
			"weatherMarker",
		);
	public mobileDateSelected = input<Date | null>(null);
	public mode = model<"calendar" | "list">("calendar");

	public monthChange = output<Date>();
	public daySelected = output<DaySelectedEvent>();
	public exportCsv = output<void>();

	public menuItems = computed<MenuItem[]>(() => [
		{
			label: "Export CSV",
			icon: "ti ti-download",
			command: () => this.openCsvExportSidebar(),
		},
	]);

	public isEntrySearchSidebarOpen = signal(false);
	public isCsvExportSidebarOpen = signal(false);

	public monthPicker = viewChild<any>("monthPicker");

	protected currentDate = linkedSignal(() =>
		this._dateQuery() ? new Date(this._dateQuery()!) : startOfToday(),
	);

	protected currentMonth = computed(() =>
		format(this.currentDate(), this.isMobile() ? "MMM yyyy" : "MMMM yyyy"),
	);

	public days = computed(() =>
		getCalendarDaysData(
			this.currentDate(),
			this.markers(),
			this.weatherMarkers(),
		),
	);

	private readonly _dayNames = [
		"Sun",
		"Mon",
		"Tue",
		"Wed",
		"Thu",
		"Fri",
		"Sat",
	];
	public readonly dayNamesFormatted = this._dayNames.map((dayName) => ({
		dayName: dayName,
		isToday: dayName === format(startOfToday(), "eee"),
	}));

	public nextMonth() {
		const nextMonth = addMonths(this.currentDate(), 1);
		this.currentDate.set(getSpecificDayOfMonth(nextMonth, 2));
		this.monthChange.emit(this.currentDate());

		this.navToMonth();
	}

	public prevMonth() {
		const prevMonth = subMonths(this.currentDate(), 1);
		this.currentDate.set(getSpecificDayOfMonth(prevMonth, 2));
		this.monthChange.emit(this.currentDate());

		this.navToMonth();
	}

	public toCurrentMonth(): void {
		this.currentDate.set(startOfToday());
		this.monthChange.emit(this.currentDate());
	}

	public toggleMonthPicker(): void {
		const inputElement = document.getElementById("month-picker-input");

		if (inputElement) {
			inputElement.click();
			inputElement.focus();
		}
	}

	public onMonthYearSelect(date: Date): void {
		this.currentDate.set(getSpecificDayOfMonth(date, 2));
		this.monthChange.emit(this.currentDate());

		this.navToMonth();
	}

	public getMarkerMapKey(date: Date): string {
		return format(date, "yyyy-MM-dd");
	}

	public selectDay(date: Date, type: "normal" | "double-tap"): void {
		this.daySelected.emit({ date, type });
	}

	public openEntrySearchSidebar(): void {
		this.isEntrySearchSidebarOpen.set(true);
	}

	public openCsvExportSidebar(): void {
		this.isCsvExportSidebarOpen.set(true);
	}

	public updateViewMode(e: boolean): void {
		const newMode = e ? "list" : "calendar";

		this.mode.set(newMode);

		this._settingsService.updateSetting("entryView", newMode);
	}

	public toggleViewMode(): void {
		const newMode = this.mode() === "list" ? "calendar" : "list";
		this.mode.set(newMode);
		this._settingsService.updateSetting("entryView", newMode);
	}

	public onExportCsv(): void {
		this.exportCsv.emit();
	}

	public back(): void {
		this._router.navigate(["../"], {
			relativeTo: this._route,
			queryParamsHandling: "merge",
			replaceUrl: true,
		});
	}

	private navToMonth() {
		this._router.navigate([], {
			queryParams: { date: format(this.currentDate(), "yyyy-MM-dd") },
			queryParamsHandling: "merge",
		});
	}

	public textButtonDt = computed<ButtonDesignTokens>(() => ({
		root: {
			iconOnlyWidth: this.isMobile() ? "1.75rem" : "3rem",
		},
	}));
}

export type CalendarMarkerData<TData = unknown> = {
	id: string;
	date: Date;
	data: TData;
	icon?: string;
};

export type DaySelectedEvent = {
	date: Date;
	type: "normal" | "double-tap";
};
