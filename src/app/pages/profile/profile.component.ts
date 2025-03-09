import { Component, effect } from '@angular/core';
import { PageContainerComponent } from '../../components/layout/page-container/page-container.component';
import { injectUserData } from '../../utils/authUtils';
import { AvatarModule } from 'primeng/avatar';
import { AvatarDesignTokens } from '@primeng/themes/types/avatar';

@Component({
  selector: 'profile',
  imports: [PageContainerComponent, AvatarModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  public user = injectUserData();

  _ = effect(() => {
    console.log(this.user());
  });

  public avatarDt: AvatarDesignTokens = {
    root: {
      fontSize: '5rem',
      width: '150px',
      height: '150px'
    }
  };
}
