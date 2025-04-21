import {
  Component,
  computed,
  inject,
  linkedSignal,
  signal
} from '@angular/core';
import { PageContainerComponent } from '../../components/layout/page-container/page-container.component';
import { getUserInitials, injectUserData } from '../../utils/authUtils';
import { AvatarModule } from 'primeng/avatar';
import { AvatarDesignTokens } from '@primeng/themes/types/avatar';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '@auth0/auth0-angular';
import { YVUser } from '../../types/user.types';
import { apiUrl, putReq } from '../../utils/httpUtils';

@Component({
  selector: 'profile',
  imports: [
    PageContainerComponent,
    AvatarModule,
    InputTextModule,
    ButtonModule,
    FormsModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  private _auth = inject(AuthService);

  public user = injectUserData();
  public userInitials = computed(() => getUserInitials(this.user() as YVUser));

  public isEditingField = signal<'name' | 'email' | null>(null);

  public name = linkedSignal(() => this.user()?.name);

  public updateName(): void {
    const userData: Partial<User> = { name: this.name() };

    putReq(apiUrl('users'), userData).subscribe((response) => {
      console.log(response);
    });
  }

  public avatarDt: AvatarDesignTokens = {
    root: {
      fontSize: '5rem',
      background: '{primary.400}',
      width: '150px',
      height: '150px'
    }
  };
}
