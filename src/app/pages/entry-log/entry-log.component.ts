import { Component, computed, signal } from '@angular/core';
import {
  CalendarMarkerData,
  EntriesCalendarComponent
} from '../../components/entries-calendar/entries-calendar.component';
import { ButtonModule } from 'primeng/button';
import { ButtonDesignTokens } from '@primeng/themes/types/button';
import { httpResource } from '@angular/common/http';
import { apiUrl } from '../../utils/httpUtils';
import { injectUserData } from '../../utils/authUtils';
import { endOfMonth, startOfMonth } from 'date-fns';
import { Entry } from '../../types/entries.types';

@Component({
  selector: 'entry-log',
  imports: [EntriesCalendarComponent, ButtonModule],
  templateUrl: './entry-log.component.html',
  styleUrl: './entry-log.component.scss'
})
export class EntryLogComponent {
  public user = injectUserData();

  public entries = httpResource<Entry[]>(() =>
    this.user()
      ? apiUrl('entries', {
          params: [this.user()!.sub || ''],
          queryParams: {
            startDate: startOfMonth(this.currentDate()),
            endDate: endOfMonth(this.currentDate())
          }
        })
      : undefined
  );

  public currentDate = signal(new Date());

  public days = computed<CalendarMarkerData[]>(() => {
    const currentMonthEntries = this.entries.value();

    return (currentMonthEntries || []).map((entry) => ({
      date: new Date(entry.date),
      icon: 'ti ti-check',
      data: entry
    }));
  });

  public logData(entry: Entry): void {
    console.log(entry);
  }

  public markerButtonDt: ButtonDesignTokens = {
    root: {
      iconOnlyWidth: '2rem'
    },
    colorScheme: {
      light: {
        root: {
          secondary: {
            background: '{sky.200}',
            borderColor: '{sky.200}',
            hoverBackground: '{sky.300}',
            hoverBorderColor: '{sky.300}'
          }
        }
      }
    }
  };

  public changeMonths(newDate: Date): void {
    this.currentDate.set(newDate);
  }
}
