import { Component } from '@angular/core';
import {
  CalendarMarkerData,
  EntriesCalendarComponent
} from '../../components/entries-calendar/entries-calendar.component';
import { ButtonModule } from 'primeng/button';
import { ButtonDesignTokens } from '@primeng/themes/types/button';

@Component({
  selector: 'entry-log',
  imports: [EntriesCalendarComponent, ButtonModule],
  templateUrl: './entry-log.component.html',
  styleUrl: './entry-log.component.scss'
})
export class EntryLogComponent {
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
      iconOnlyWidth: '1.5rem'
    }
  };
}
