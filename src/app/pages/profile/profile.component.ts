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
import { AuthService } from '@auth0/auth0-angular';
import { YVUser } from '../../types/user.types';

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
    const data = JSON.stringify({
      name: this.name()
    });

    // this._auth.getAccessTokenSilently().subscribe({
    //   next: (token) => {
    //     console.log({ data });

    //     const config = {
    //       method: 'patch',
    //       maxBodyLength: Infinity,
    //       headers: {
    //         'Content-Type': 'application/json',
    //         Accept: 'application/json',
    //         Authorization: `Bearer ${token}`
    //       }
    //     };

    //     postReq(
    //       `${AUTH0_USER_MANAGEMENT_URL}/${this.user()?.sub}`,
    //       data,
    //       config
    //     );
    //   }
    // });
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
