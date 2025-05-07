import { DatePipe, Location, NgTemplateOutlet } from '@angular/common';
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
  TemplateRef
} from '@angular/core';
import { addMonths, format, startOfToday, subMonths } from 'date-fns';
import { getCalendarDaysData } from './utils';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { GlobalUiService } from '../../../services/global-ui.service';
import { LoadingSpinnerComponent } from '../../miscellanious/loading-spinner/loading-spinner.component';
import { DoubleTapDirective } from '../../../directives/double-tap.directive';
import { SwipeDirective } from '../../../directives/swipe.directive';
import { EntrySearchSidebarComponent } from '../entry-search-sidebar/entry-search-sidebar.component';
import { ButtonDesignTokens } from '@primeng/themes/types/button';
import { PopoverModule } from 'primeng/popover';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../services/settings.service';

@Component({
  selector: 'entries-calendar',
  templateUrl: './entries-calendar.component.html',
  styleUrl: './entries-calendar.component.scss',
  standalone: true,
  imports: [
    DatePipe,
    NgTemplateOutlet,
    ButtonModule,
    LoadingSpinnerComponent,
    DoubleTapDirective,
    SwipeDirective,
    EntrySearchSidebarComponent,
    PopoverModule,
    ToggleSwitchModule,
    FormsModule
  ]
})
export class EntriesCalendarComponent {
  private _router = inject(Router);
  private _location = inject(Location);
  private _globalUiService = inject(GlobalUiService);
  private _settingsService = inject(SettingsService);

  public isMobile = this._globalUiService.isMobile;
  public isDarkMode = this._globalUiService.isDarkMode;

  private _dateQuery = toSignal(
    this._router.routerState.root.queryParams.pipe(
      map((params) => params['date'] as string)
    )
  );

  public markers = input<CalendarMarkerData[]>([]);
  public isLoadingData = input<boolean>(false);
  public markerTpl =
    contentChild<TemplateRef<{ $implicit: CalendarMarkerData[] }>>('marker');
  public mobileDateSelected = input<Date | null>(null);
  public mode = model<'calendar' | 'list'>('calendar');

  public monthChange = output<Date>();
  public daySelected = output<DaySelectedEvent>();

  public isEntrySearchSidebarOpen = signal(false);

  protected currentDate = linkedSignal(() =>
    this._dateQuery() ? new Date(this._dateQuery()!) : startOfToday()
  );
  protected currentMonth = computed(() =>
    format(this.currentDate(), this.isMobile() ? 'MMM yyyy' : 'MMMM yyyy')
  );

  public days = computed(() =>
    getCalendarDaysData(this.currentDate(), this.markers())
  );

  private readonly _dayNames = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat'
  ];
  public readonly dayNamesFormatted = this._dayNames.map((dayName) => ({
    dayName: dayName,
    isToday: dayName === format(startOfToday(), 'eee')
  }));

  public nextMonth() {
    this.currentDate.set(addMonths(this.currentDate(), 1));
    this.monthChange.emit(this.currentDate());

    this.navToMonth();
  }

  public prevMonth() {
    this.currentDate.set(subMonths(this.currentDate(), 1));
    this.monthChange.emit(this.currentDate());

    this.navToMonth();
  }

  public toCurrentMonth(): void {
    this.currentDate.set(startOfToday());
    this.monthChange.emit(this.currentDate());
  }

  public getMarkerMapKey(date: Date): string {
    return format(date, 'yyyy-MM-dd');
  }

  public selectDay(date: Date, type: 'normal' | 'double-tap'): void {
    this.daySelected.emit({ date, type });
  }

  public openEntrySearchSidebar(): void {
    this.isEntrySearchSidebarOpen.set(true);
  }

  public updateViewMode(e: boolean): void {
    const newMode = e ? 'list' : 'calendar';

    this.mode.set(newMode);

    this._settingsService.updateSetting('entryView', newMode);
  }

  public back(): void {
    this._location.back();
  }

  private navToMonth() {
    this._router.navigate([], {
      queryParams: { date: format(this.currentDate(), 'yyyy-MM-dd') },
      queryParamsHandling: 'merge'
    });
  }

  public textButtonDt = computed<ButtonDesignTokens>(() => ({
    root: {
      iconOnlyWidth: this.isMobile() ? '1.75rem' : '3rem'
    }
  }));
}

export type CalendarMarkerData<TData = unknown> = {
  date: Date;
  data: TData;
  icon?: string;
};

export type DaySelectedEvent = {
  date: Date;
  type: 'normal' | 'double-tap';
};
