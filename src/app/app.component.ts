import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { MainHeaderComponent } from './components/layout/main-header/main-header.component';
import { MainSideNavComponent } from './components/layout/main-side-nav/main-side-nav.component';
import { injectBreakpointObserver } from './utils/styleUtils';
import { SM_BREAKPOINT } from './constants/style-constants';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MainHeaderComponent,
    MainSideNavComponent,
    ToastModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private _auth = inject(AuthService);

  public isSmallScreen = injectBreakpointObserver(
    `(max-width: ${SM_BREAKPOINT})`
  );

  public isLoggedIn = signal(false);

  public ngOnInit(): void {
    this._auth.isAuthenticated$.subscribe((isAuthenticated) => {
      this.isLoggedIn.set(isAuthenticated);

      if (!isAuthenticated) {
        this._auth.loginWithRedirect();
      }
    });
  }
}
