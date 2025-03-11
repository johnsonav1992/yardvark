import { Component } from '@angular/core';
import { CalendarComponent } from '../../components/calendar/calendar.component';

@Component({
  selector: 'dashboard',
  imports: [CalendarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {}
