import { Component, signal } from '@angular/core';
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

@Component({
  selector: 'entry-log',
  imports: [EntriesCalendarComponent, ButtonModule],
  templateUrl: './entry-log.component.html',
  styleUrl: './entry-log.component.scss'
})
export class EntryLogComponent {
  public user = injectUserData();

  public entries = httpResource<unknown>(() =>
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

  public days: CalendarMarkerData[] = [
    {
      date: new Date(),
      data: 'test',
      icon: 'ti ti-garden-cart'
    },
    {
      date: new Date(),
      data: 'test',
      icon: 'ti ti-check'
    }
  ];

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
