import { DatePipe, NgTemplateOutlet } from '@angular/common';
import {
  Component,
  computed,
  contentChild,
  input,
  output,
  signal,
  TemplateRef
} from '@angular/core';
import { addMonths, format, startOfToday, subMonths } from 'date-fns';
import { getCalendarDaysData } from './utils';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'entries-calendar',
  templateUrl: './entries-calendar.component.html',
  styleUrl: './entries-calendar.component.scss',
  standalone: true,
  imports: [DatePipe, NgTemplateOutlet, ButtonModule]
})
export class EntriesCalendarComponent {
  public markers = input<CalendarMarkerData[]>([]);
  public markerTpl =
    contentChild<TemplateRef<{ $implicit: CalendarMarkerData[] }>>('marker');

  public monthChange = output<Date>();

  protected currentDate = signal(startOfToday());
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
}

export interface CalendarMarkerData<Data = unknown> {
  date: Date;
  data: Data;
}
