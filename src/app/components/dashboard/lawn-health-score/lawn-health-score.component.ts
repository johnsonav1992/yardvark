import { Component, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { PopoverModule } from 'primeng/popover';
import { ButtonModule } from 'primeng/button';
import { DividerDesignTokens } from '@primeng/themes/types/divider';
import { LawnHealthScoreService } from '../../../services/lawn-health-score.service';

@Component({
  selector: 'lawn-health-score',
  imports: [CardModule, DividerModule, PopoverModule, ButtonModule],
  templateUrl: './lawn-health-score.component.html',
  styleUrl: './lawn-health-score.component.scss'
})
export class LawnHealthScoreComponent {
  private _lawnHealthScoreService = inject(LawnHealthScoreService);
  private _router = inject(Router);

  public lawnHealthScore = this._lawnHealthScoreService.lawnHealthScore;
  public finalDescription = this._lawnHealthScoreService.finalDescription;
  public scoreColor = this._lawnHealthScoreService.scoreColor;

  public isAiGenerated = computed(() => {
    const aiResource = this._lawnHealthScoreService.aiDescriptionResource;
    const aiDescription = aiResource.hasValue() ? aiResource.value() : '';
    const currentDescription = this.finalDescription();
    
    return aiDescription && currentDescription === aiDescription;
  });

  public dividerDt: DividerDesignTokens = {
    horizontal: {
      margin: 'none'
    }
  };

  public navigateToCreateEntry(): void {
    this._router.navigate(['/entry-log'], { queryParams: { create: true } });
  }
}
