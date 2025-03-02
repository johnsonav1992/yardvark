import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SoilTemperatureService } from './services/soil-temperature.service';
import { SoilTemperatureDisplayComponent } from './components/soil-temperature-display/soil-temperature-display.component';
import { MainHeaderComponent } from './components/main-header/main-header.component';
import { AuthService } from '@auth0/auth0-angular';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MainHeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private _soil = inject(SoilTemperatureService);
  public auth = inject(AuthService);
  public user = toSignal(this.auth.user$);

  _ = effect(() => {
    console.log(this.user());
  });

  public soil = this._soil.soilTemperatureData;
  title = 'yardvark';
}
