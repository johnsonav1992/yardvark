import { DatePipe, Location, NgTemplateOutlet } from '@angular/common';
import {
  Component,
  computed,
  contentChild,
  inject,
  input,
  linkedSignal,
  output,
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

@Component({
  selector: 'entries-calendar',
  templateUrl: './entries-calendar.component.html',
  styleUrl: './entries-calendar.component.scss',
  standalone: true,
  imports: [DatePipe, NgTemplateOutlet, ButtonModule, LoadingSpinnerComponent]
})
export class EntriesCalendarComponent {
  private _router = inject(Router);
  private _location = inject(Location);
  private _globalUiService = inject(GlobalUiService);

  public isMobile = this._globalUiService.isMobile;

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

  public monthChange = output<Date>();
  public daySelected = output<Date>();

  protected currentDate = linkedSignal(() =>
    this._dateQuery() ? new Date(this._dateQuery()!) : startOfToday()
  );
  protected currentMonth = computed(() =>
    format(this.currentDate(), 'MMMM yyyy')
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
  }

  public prevMonth() {
    this.currentDate.set(subMonths(this.currentDate(), 1));
    this.monthChange.emit(this.currentDate());
  }

  public toCurrentMonth(): void {
    this.currentDate.set(startOfToday());
    this.monthChange.emit(this.currentDate());
  }

  public getMarkerMapKey(date: Date): string {
    return format(date, 'yyyy-MM-dd');
  }

  public selectDay(date: Date): void {
    this.daySelected.emit(date);
  }

  public back(): void {
    this._location.back();
  }
}

export type CalendarMarkerData<TData = unknown> = {
  date: Date;
  data: TData;
  icon?: string;
};
