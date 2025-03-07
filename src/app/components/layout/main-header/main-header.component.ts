import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@auth0/auth0-angular';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { SoilTemperatureDisplayComponent } from './soil-temperature-display/soil-temperature-display.component';

@Component({
  selector: 'main-header',
  imports: [AvatarModule, MenuModule, SoilTemperatureDisplayComponent],
  templateUrl: './main-header.component.html',
  styleUrl: './main-header.component.scss'
})
export class MainHeaderComponent {
  private _authService = inject(AuthService);

  public user = toSignal(this._authService.user$);

  public menuItems: MenuItem[] = [
    {
      label: 'Settings',
      icon: 'ti ti-settings',
      command: () => {
        console.log('Settings');
      }
    },
    {
      label: 'Logout',
      icon: 'ti ti-logout',
      command: () => this._authService.logout()
    }
  ];
}
