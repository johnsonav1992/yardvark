import {
  Component,
  computed,
  inject,
  linkedSignal,
  signal
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Entry } from '../../../types/entries.types';
import { PageContainerComponent } from '../../../components/layout/page-container/page-container.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { apiUrl, deleteReq } from '../../../utils/httpUtils';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CardDesignTokens } from '@primeng/themes/types/card';
import { ChipModule } from 'primeng/chip';
import { ChipDesignTokens } from '@primeng/themes/types/chip';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { capitalize } from '../../../utils/stringUtils';
import { startOfMonth } from 'date-fns';
import { ProductSmallCardComponent } from '../../../components/products/product-small-card/product-small-card.component';
import { EntriesService } from '../../../services/entries.service';

@Component({
  selector: 'entry-view',
  imports: [
    DatePipe,
    PageContainerComponent,
    ButtonModule,
    CardModule,
    ChipModule,
    DividerModule,
    SkeletonModule,
    ProductSmallCardComponent
  ],
  templateUrl: './entry-view.component.html',
  styleUrl: './entry-view.component.scss'
})
export class EntryViewComponent {
  private _router = inject(Router);
  private _activatedRoute = inject(ActivatedRoute);
  private _entryService = inject(EntriesService);

  public entryId = toSignal(
    this._activatedRoute.params.pipe(map((params) => params['entryId']))
  );

  public entryDate = toSignal(
    this._activatedRoute.queryParams.pipe(
      map((params) => params['date'] as string)
    )
  );

  public currentDate = computed<Date | null>(() =>
    this.entryDate() ? new Date(this.entryDate()!) : null
  );

  public shouldFetchEntry = signal<boolean>(false);
  public entryData = linkedSignal<Entry | undefined>(() =>
    this.entryResource.value()
  );
  public activities = computed(() =>
    this.entryData()?.activities.map((act) => ({
      ...act,
      name: capitalize(act.name)
    }))
  );

  public entryResource = this._entryService.getEntryResource(
    this.shouldFetchEntry,
    this.entryId
  );

  public constructor() {
    const entryData =
      this._router.getCurrentNavigation()?.extras.state?.['entry'];

    entryData ? this.entryData.set(entryData) : this.shouldFetchEntry.set(true);
  }

  public deleteEntry() {
    deleteReq(apiUrl('entries', { params: [this.entryId()] })).subscribe(() => {
      this._router.navigate(['entry-log'], {
        queryParams: { date: startOfMonth(this.currentDate() || new Date()) }
      });
    });
  }

  public soilTempChipDt: ChipDesignTokens = {
    root: {
      background: '{primary.200}',
      color: '{primary.800}'
    },
    icon: {
      color: '{primary.800}'
    }
  };
}
