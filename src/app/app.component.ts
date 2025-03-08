import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { MainHeaderComponent } from './components/layout/main-header/main-header.component';
import { MainSideNavComponent } from './components/layout/main-side-nav/main-side-nav.component';
import { httpResource } from '@angular/common/http';
import { BE_URL } from './constants/api-constants';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MainHeaderComponent, MainSideNavComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private _auth = inject(AuthService);

  public isLoggedIn = signal(false);

  public posts = httpResource(`${BE_URL}/posts`);

  public ngOnInit(): void {
    this._auth.isAuthenticated$.subscribe((isAuthenticated) => {
      this.isLoggedIn.set(isAuthenticated);

      if (!isAuthenticated) {
        this._auth.loginWithRedirect();
      }
    });
  }
}
