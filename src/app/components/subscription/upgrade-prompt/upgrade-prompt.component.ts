import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'upgrade-prompt',
  standalone: true,
  imports: [MessageModule, ButtonModule],
  template: `
    <p-message severity="warn" [closable]="false">
      <div class="flex flex-column gap-3">
        <span>{{ message }}</span>
        <p-button
          label="Upgrade to Pro"
          icon="ti ti-crown"
          size="small"
          (onClick)="navigateToSubscription()"
        />
      </div>
    </p-message>
  `,
})
export class UpgradePromptComponent {
  @Input() message = 'Upgrade to unlock this feature';
  private router = inject(Router);

  navigateToSubscription() {
    this.router.navigate(['/subscription']);
  }
}
