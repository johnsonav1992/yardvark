import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@auth0/auth0-angular';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'main-header',
  imports: [AvatarModule],
  templateUrl: './main-header.component.html',
  styleUrl: './main-header.component.scss',
})
export class MainHeaderComponent {
  public auth = inject(AuthService);
  public user = toSignal(this.auth.user$);
}
