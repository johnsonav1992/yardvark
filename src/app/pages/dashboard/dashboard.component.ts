import { Component, inject } from '@angular/core';
import { PageContainerComponent } from '../../components/layout/page-container/page-container.component';
import { RecentEntryComponent } from '../../components/dashboard/recent-entry/recent-entry.component';
import { EntriesService } from '../../services/entries.service';
import { LoadingSpinnerComponent } from '../../components/miscellanious/loading-spinner/loading-spinner.component';
import { MessageModule } from 'primeng/message';
import { injectUserData } from '../../utils/authUtils';

@Component({
  selector: 'dashboard',
  imports: [
    PageContainerComponent,
    RecentEntryComponent,
    LoadingSpinnerComponent,
    MessageModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  private _entriesService = inject(EntriesService);

  public user = injectUserData();

  public recentEntries = this._entriesService.getMostRecentEntryResource();
}
