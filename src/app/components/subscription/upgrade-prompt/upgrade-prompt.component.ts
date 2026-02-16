import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'upgrade-prompt',
  standalone: true,
  imports: [CardModule, ButtonModule],
  templateUrl: './upgrade-prompt.component.html',
  styleUrl: './upgrade-prompt.component.scss'
})
export class UpgradePromptComponent {
  message = input<string>('Upgrade to unlock this feature');
  private router = inject(Router);

  navigateToSubscription() {
    this.router.navigate(['/subscription']);
  }
}
