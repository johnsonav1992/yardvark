import { Component, input } from '@angular/core';

@Component({
  selector: 'weather-day-marker',
  imports: [],
  templateUrl: './weather-day-marker.html',
  styleUrl: './weather-day-marker.scss'
})
export class WeatherDayMarker {
  public icon = input.required<string>();
}
