import { Component, computed, input } from '@angular/core';
import { ProgressSpinnerDesignTokens } from '@primeng/themes/types/progressspinner';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'loading-spinner',
  imports: [ProgressSpinnerModule],
  templateUrl: './loading-spinner.component.html',
  styleUrl: './loading-spinner.component.scss'
})
export class LoadingSpinnerComponent {
  public size = input<'xs' | 's' | 'm' | 'l'>('l');

  public renderedSize = computed(() => {
    const sizeMap = {
      xs: '20px',
      s: '50px',
      m: '80px',
      l: '100px'
    };

    return sizeMap[this.size()] || sizeMap['l'];
  });

  public spinnerDt: ProgressSpinnerDesignTokens = {
    root: {
      'color.1': '{primary.500}',
      'color.2': '{primary.500}',
      'color.3': '{primary.500}',
      'color.4': '{primary.500}'
    }
  };
}
