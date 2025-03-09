import { Component, linkedSignal, signal } from '@angular/core';
import { PageContainerComponent } from '../../components/layout/page-container/page-container.component';
import { injectUserData } from '../../utils/authUtils';
import { AvatarModule } from 'primeng/avatar';
import { AvatarDesignTokens } from '@primeng/themes/types/avatar';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';

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
  public user = injectUserData();

  public isEditingField = signal<'name' | 'email' | null>(null);

  public name = linkedSignal(() => this.user()?.name);

  public avatarDt: AvatarDesignTokens = {
    root: {
      fontSize: '5rem',
      width: '150px',
      height: '150px'
    }
  };
}
