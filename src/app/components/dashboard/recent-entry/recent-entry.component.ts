import { Component, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ProductSmallCardComponent } from '../../products/product-small-card/product-small-card.component';
import { injectUserData } from '../../../utils/authUtils';
import { EntriesService } from '../../../services/entries.service';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';

@Component({
  selector: 'recent-entry',
  imports: [
    CardModule,
    ProductSmallCardComponent,
    DatePipe,
    NgTemplateOutlet,
    ButtonModule
  ],
  templateUrl: './recent-entry.component.html',
  styleUrl: './recent-entry.component.scss'
})
export class RecentEntryComponent {
  private _router = inject(Router);
  private _entriesService = inject(EntriesService);

  public user = injectUserData();
  public recentEntry = this._entriesService.getMostRecentEntryResource(
    this.user
  );

  public goToEntry() {
    this._router.navigate(['entry-log', this.recentEntry.value()?.id]);
  }
}
