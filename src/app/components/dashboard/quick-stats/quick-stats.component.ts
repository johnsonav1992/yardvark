import { Component, computed, inject, output } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { EntriesService } from '../../../services/entries.service';
import { differenceInDays } from 'date-fns';
import { getLawnSeasonCompletedPercentage } from '../../../utils/lawnSeasonUtils';
import { ProgressBarModule } from 'primeng/progressbar';
import { DividerModule } from 'primeng/divider';
import { DividerDesignTokens } from '@primeng/themes/types/divider';
import { GlobalUiService } from '../../../services/global-ui.service';
import { LocationService } from '../../../services/location.service';
import { CdkDragHandle } from '@angular/cdk/drag-drop';

@Component({
  selector: 'quick-stats',
  imports: [CardModule, ButtonModule, TooltipModule, ProgressBarModule, DividerModule, CdkDragHandle],
  templateUrl: './quick-stats.component.html',
  styleUrl: './quick-stats.component.scss'
})
export class QuickStatsComponent {
  private _entriesService = inject(EntriesService);
  private _locationService = inject(LocationService);
  private _globalUiService = inject(GlobalUiService);

  public isMobile = this._globalUiService.isMobile;

  public onHideWidget = output<void>();

  public lastMowDate = this._entriesService.lastMow;
  public lastEntry = this._entriesService.recentEntry;
  public userCoords = this._locationService.userLatLong;

  public isLoading = computed(() =>
    this.lastMowDate.isLoading() ||
    this.lastEntry.isLoading() ||
    this._entriesService.lastProductApp.isLoading()
  );

  public daysSinceLastMow = computed(() => {
    const lastMowDate = this.lastMowDate.value()?.lastMowDate;

    if (!lastMowDate) return 'N/A';

    const daysSince = differenceInDays(new Date(), new Date(lastMowDate));

    return daysSince ?? 'N/A';
  });

  public daysSinceLastEntry = computed(() => {
    const lastEntry = this.lastEntry.value();

    if (!lastEntry) return 'N/A';

    const daysSince = differenceInDays(new Date(), new Date(lastEntry.date));

    return daysSince ?? 'N/A';
  });

  public daysSinceLastProductApplication = computed(() => {
    const lastProductAppDate =
      this._entriesService.lastProductApp.value()?.lastProductAppDate;

    if (!lastProductAppDate) return 'N/A';

    const daysSince = differenceInDays(
      new Date(),
      new Date(lastProductAppDate)
    );

    return daysSince ?? 'N/A';
  });

  public lawnSeasonPercentage = computed(() => {
    const coords = this.userCoords();

    if (!coords) return null;

    const progressPercentage = getLawnSeasonCompletedPercentage(coords);

    if (progressPercentage < 0 || progressPercentage > 100) {
      return null;
    }

    return progressPercentage;
  });

  public dividerDt: DividerDesignTokens = {
    horizontal: {
      margin: 'none'
    }
  };

  public hideWidget(): void {
    this.onHideWidget.emit();
  }
}
