import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@auth0/auth0-angular';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';

@Component({
  selector: 'main-header',
  imports: [AvatarModule, MenuModule],
  templateUrl: './main-header.component.html',
  styleUrl: './main-header.component.scss',
})
export class MainHeaderComponent {
  public auth = inject(AuthService);
  public user = toSignal(this.auth.user$);

  public menuItems: MenuItem[] = [
    {
      label: 'Logout',
      command: () => this.auth.logout(),
    },
  ];
}
