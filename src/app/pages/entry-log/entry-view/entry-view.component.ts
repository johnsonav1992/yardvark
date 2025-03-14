import { Component, inject, linkedSignal, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Entry } from '../../../types/entries.types';
import { PageContainerComponent } from '../../../components/layout/page-container/page-container.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { httpResource } from '@angular/common/http';
import { apiUrl } from '../../../utils/httpUtils';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CardDesignTokens } from '@primeng/themes/types/card';

@Component({
  selector: 'entry-view',
  imports: [DatePipe, PageContainerComponent, ButtonModule, CardModule],
  templateUrl: './entry-view.component.html',
  styleUrl: './entry-view.component.scss'
})
export class EntryViewComponent {
  private _router = inject(Router);
  private _activatedRoute = inject(ActivatedRoute);

  public entryId = toSignal(
    this._activatedRoute.params.pipe(map((params) => params['entryId']))
  );

  public shouldFetchEntry = signal<boolean>(false);
  public entryData = linkedSignal<Entry | undefined>(() =>
    this.entryResource.value()
  );

  public entryResource = httpResource<Entry>(() =>
    this.shouldFetchEntry() && this.entryId()
      ? apiUrl('entries/single', { params: [this.entryId()] })
      : undefined
  );

  public constructor() {
    const entryData =
      this._router.getCurrentNavigation()?.extras.state?.['entry'];

    entryData ? this.entryData.set(entryData) : this.shouldFetchEntry.set(true);
  }

  public cardDt: CardDesignTokens = {
    root: {
      shadow: '2px 2px 8px 0 rgba(0, 0, 0, 0.2)'
    }
  };
}
