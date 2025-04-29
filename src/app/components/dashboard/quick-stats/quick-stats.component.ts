import { Component, computed, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { EntriesService } from '../../../services/entries.service';
import { differenceInDays } from 'date-fns';

@Component({
  selector: 'quick-stats',
  imports: [CardModule],
  templateUrl: './quick-stats.component.html',
  styleUrl: './quick-stats.component.scss'
})
export class QuickStatsComponent {
  private _entriesService = inject(EntriesService);
  public lastMowDate = this._entriesService.getLastMowDateResource();

  public daysSinceLastMow = computed(() => {
    const lastMowDate = this.lastMowDate.value()?.lastMowDate;

    if (!lastMowDate) return null;

    const daysSince = differenceInDays(new Date(), new Date(lastMowDate));

    return daysSince;
  });
}
