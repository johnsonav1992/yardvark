import { Component } from '@angular/core';
import {
  CalendarMarkerData,
  EntriesCalendarComponent
} from '../../components/entries-calendar/entries-calendar.component';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'entry-log',
  imports: [EntriesCalendarComponent, JsonPipe],
  templateUrl: './entry-log.component.html',
  styleUrl: './entry-log.component.scss'
})
export class EntryLogComponent {
  days: CalendarMarkerData[] = [
    {
      date: new Date(),
      data: 'test'
    }
  ];
}
