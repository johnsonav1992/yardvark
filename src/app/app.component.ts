import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SoilTemperatureService } from './services/soil-temperature.service';
import { SoilTemperatureDisplayComponent } from './components/soil-temperature-display/soil-temperature-display.component';
import { MainHeaderComponent } from './components/main-header/main-header.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MainHeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private _soil = inject(SoilTemperatureService);

  public soil = this._soil.soilTemperatureData;
  title = 'yardvark';
}
