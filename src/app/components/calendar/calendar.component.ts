import { DatePipe, NgTemplateOutlet } from '@angular/common';
import {
  Component,
  computed,
  input,
  output,
  signal,
  TemplateRef
} from '@angular/core';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  startOfMonth,
  startOfToday,
  subMonths
} from 'date-fns';
import { getCalendarDaysData } from './utils';

@Component({
  selector: 'calendar',
  templateUrl: './calendar.component.html',
  standalone: true,
  imports: [DatePipe, NgTemplateOutlet]
})
export class CalendarComponent {
  public markers = input<CalendarMarkerData[], CalendarMarkerData[] | null>(
    [],
    {
      transform: (value) => value ?? []
    }
  );
  public markerTpl = input<TemplateRef<{ $implicit: CalendarMarkerData[] }>>();

  public monthChange = output<Date>();

  protected currentDate = signal(startOfToday());
  protected currentMonth = computed(() =>
    format(this.currentDate(), 'MMMM yyyy')
  );

  protected readonly startDateOfSelectedMonth = computed(() => {
    return startOfMonth(this.currentDate());
  });
  protected readonly endDateOfSelectedMonth = computed(() => {
    return endOfMonth(this.currentDate());
  });

  protected readonly days = computed(() => {
    return eachDayOfInterval({
      start: this.startDateOfSelectedMonth(),
      end: this.endDateOfSelectedMonth()
    });
  });

  readonly markersMap = computed(() => {
    const map: Map<string, CalendarMarkerData[]> = new Map();
    this.markers().forEach((marker) => {
      const date = marker.date;
      const markers = map.get(this.getMarkerMapKey(date)) || [];
      markers.push(marker);
      map.set(this.getMarkerMapKey(date), markers);
    });
    return map;
  });

  /**
   * Returns the days enriched with grid offsets and markers
   */
  public daysEnriched = computed(() =>
    getCalendarDaysData(this.currentDate(), this.markers())
  );

  readonly dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  protected readonly dayNamesFormatted = this.dayNames.map((dayName) => ({
    dayName: dayName,
    isToday: dayName === format(startOfToday(), 'eee')
  }));

  protected nextMonth() {
    this.currentDate.set(addMonths(this.currentDate(), 1));
    this.monthChange.emit(this.currentDate());
  }

  protected prevMonth() {
    this.currentDate.set(subMonths(this.currentDate(), 1));
    this.monthChange.emit(this.currentDate());
  }

  protected toCurrentMonth(): void {
    this.currentDate.set(startOfToday());
    this.monthChange.emit(this.currentDate());
  }

  protected getMarkerMapKey(date: Date): string {
    return format(date, 'yyyy-MM-dd');
  }
}

export interface CalendarMarkerData<Data = any> {
  date: Date;
  data: Data;
}
