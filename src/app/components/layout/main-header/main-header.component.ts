import { Component, computed, inject } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { SoilTemperatureDisplayComponent } from './soil-temperature-display/soil-temperature-display.component';
import { getUserInitials, injectUserData } from '../../../utils/authUtils';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { GlobalUiService } from '../../../services/global-ui.service';
import { AvatarDesignTokens } from '@primeng/themes/types/avatar';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'main-header',
  imports: [
    AvatarModule,
    MenuModule,
    SoilTemperatureDisplayComponent,
    RouterLink,
    ButtonModule
  ],
  templateUrl: './main-header.component.html',
  styleUrl: './main-header.component.scss'
})
export class MainHeaderComponent {
  private _authService = inject(AuthService);
  private _globalUiService = inject(GlobalUiService);

  public isMobile = this._globalUiService.isMobile;

  public user = injectUserData();

  public isDefaultPicture = computed(() =>
    this.user()?.picture?.includes('gravatar')
  );

  public userInitials = computed(() => getUserInitials(this.user()));

  public menuItems: MenuItem[] = [
    {
      label: 'Profile',
      icon: 'ti ti-user',
      routerLink: '/profile'
    },
    {
      label: 'Settings',
      icon: 'ti ti-settings',
      routerLink: '/settings'
    },
    {
      label: 'Logout',
      icon: 'ti ti-logout',
      command: () =>
        this._authService.logout({
          logoutParams: {
            returnTo: environment.feAppUrl
          }
        })
    }
  ];

  public toggleSideNav(): void {
    this._globalUiService.isMobileSidebarOpen.update((isOpen) => !isOpen);
  }

  public avatarDt: AvatarDesignTokens = {
    root: {
      background: '{primary.400}',
      fontSize: '.9rem'
    }
  };
}
