import { Component, inject } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { SoilTemperatureDisplayComponent } from './soil-temperature-display/soil-temperature-display.component';
import { injectUserData } from '../../../utils/authUtils';
import { injectBreakpointObserver } from '../../../utils/styleUtils';
import { SM_BREAKPOINT } from '../../../constants/style-constants';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { GlobalUiService } from '../../../services/global-ui.service';

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

  public isSmallScreen = injectBreakpointObserver(
    `(max-width: ${SM_BREAKPOINT})`
  );

  public user = injectUserData();

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
      command: () => this._authService.logout()
    }
  ];

  public toggleSideNav(): void {
    this._globalUiService.isMobileSidebarOpen.update((isOpen) => !isOpen);
  }
}
