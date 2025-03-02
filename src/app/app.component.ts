import { Component, effect, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SoilTemperatureService } from './services/soil-temperature.service';
import { MainHeaderComponent } from './components/main-header/main-header.component';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MainHeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private _soil = inject(SoilTemperatureService);
  private _auth = inject(AuthService);

  public isLoading = signal(false);

  public ngOnInit(): void {
    this.isLoading.set(true);
    this._auth.isAuthenticated$.subscribe((isAuthenticated) => {
      if (!isAuthenticated) {
        this._auth.loginWithRedirect();
      }
      this.isLoading.set(false);
    });
  }

  public soil = this._soil.soilTemperatureData;
}
