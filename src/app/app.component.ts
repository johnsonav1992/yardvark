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
  private _auth = inject(AuthService);

  public ngOnInit(): void {
    console.log(this._auth);
    this._auth.isAuthenticated$.subscribe((isAuthenticated) => {
      console.log(isAuthenticated);
      if (!isAuthenticated) {
        this._auth.loginWithRedirect();
      }
    });
  }

  public soil = this._soil.soilTemperatureData;
  title = 'yardvark';
}
