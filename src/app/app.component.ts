import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { MainHeaderComponent } from './components/layout/main-header/main-header.component';
import { MainSideNavComponent } from './components/layout/main-side-nav/main-side-nav.component';
import { ToastModule } from 'primeng/toast';
import { GlobalUiService } from './services/global-ui.service';
import LogRocket from 'logrocket';
import { toSignal } from '@angular/core/rxjs-interop';
import { LoadingSpinnerComponent } from './components/miscellanious/loading-spinner/loading-spinner.component';
import { environment } from '../environments/environment';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { SwUpdate } from '@angular/service-worker';
import { ConfirmationService } from 'primeng/api';
import { WeatherService } from './services/weather-service';
import { effectSignalLogger } from './utils/generalUtils';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MainHeaderComponent,
    MainSideNavComponent,
    ToastModule,
    LoadingSpinnerComponent,
    ConfirmDialog
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private _auth = inject(AuthService);
  private _globalUiService = inject(GlobalUiService);
  private _swUpdate = inject(SwUpdate);
  private _confirmationService = inject(ConfirmationService);
  private _weatherService = inject(WeatherService);

  public isMobile = this._globalUiService.isMobile;

  public isLoggedIn = signal(false);
  public isAuthLoading = toSignal(this._auth.isLoading$);

  public weatherData = this._weatherService.weatherData;

  _ = effectSignalLogger(this.weatherData.value);

  public constructor() {
    if (this._swUpdate.isEnabled) {
      this._swUpdate.versionUpdates.subscribe((event) => {
        if (event.type === 'VERSION_READY') {
          this._confirmationService.confirm({
            header: 'Update Available',
            message:
              'A new version of the app is available. Would you like to load it?',
            accept: () => {
              this._swUpdate
                .activateUpdate()
                .then(() => document.location.reload());
            },
            reject: () => {
              console.log('User chose not to update.');
            }
          });
        }
      });
    }
  }

  public ngOnInit(): void {
    this._auth.isAuthenticated$.subscribe((isAuthenticated) => {
      this.isLoggedIn.set(isAuthenticated);

      if (!isAuthenticated) {
        this._auth.loginWithRedirect();
      }
    });

    environment.production &&
      this._auth.user$.subscribe((user) => {
        if (user) {
          LogRocket.identify(user.sub!, {
            name: user.name!,
            email: user.email!
          });
        }
      });
  }
}
