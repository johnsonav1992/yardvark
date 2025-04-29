import { Component, computed, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { EntriesService } from '../../../services/entries.service';
import { differenceInDays } from 'date-fns';
import { SettingsService } from '../../../services/settings.service';
import { getLawnSeasonCompletedPercentage } from '../../../utils/lawnSeasonUtils';
import { ProgressBarModule } from 'primeng/progressbar';
import { DividerModule } from 'primeng/divider';
import { DividerDesignTokens } from '@primeng/themes/types/divider';

@Component({
  selector: 'quick-stats',
  imports: [CardModule, ProgressBarModule, DividerModule],
  templateUrl: './quick-stats.component.html',
  styleUrl: './quick-stats.component.scss'
})
export class QuickStatsComponent {
  private _entriesService = inject(EntriesService);
  private _settingsService = inject(SettingsService);

  public lastMowDate = this._entriesService.lastMow;
  public lastEntry = this._entriesService.recentEntry;

  public daysSinceLastMow = computed(() => {
    const lastMowDate = this.lastMowDate.value()?.lastMowDate;

    if (!lastMowDate) return null;

    const daysSince = differenceInDays(new Date(), new Date(lastMowDate));

    return daysSince;
  });

  public daysSinceLastEntry = computed(() => {
    const lastEntry = this.lastEntry.value();

    if (!lastEntry) return null;

    const daysSince = differenceInDays(new Date(), new Date(lastEntry.date));

    return daysSince;
  });

  public lawnSeasonPercentage = computed(() => {
    const grassType = this._settingsService.currentSettings()?.grassType;

    if (grassType === 'cool') return null;

    return getLawnSeasonCompletedPercentage();
  });

  public dividerDt: DividerDesignTokens = {
    horizontal: {
      margin: 'none'
    }
  };
}
