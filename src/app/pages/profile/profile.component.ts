import { Component, computed } from '@angular/core';
import { PageContainerComponent } from '../../components/layout/page-container/page-container.component';
import { injectUserData } from '../../utils/authUtils';

@Component({
  selector: 'profile',
  imports: [PageContainerComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  public user = injectUserData();

  public userName = computed(() => this.user()?.name || '');
}
