import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Entry } from '../../../types/entries.types';
import { PageContainerComponent } from '../../../components/layout/page-container/page-container.component';
import { effectSignalLogger } from '../../../utils/generalUtils';

@Component({
  selector: 'entry-view',
  imports: [DatePipe, PageContainerComponent],
  templateUrl: './entry-view.component.html',
  styleUrl: './entry-view.component.scss'
})
export class EntryViewComponent {
  private _router = inject(Router);

  public entryData = signal<Entry | null>(null);

  _ = effectSignalLogger(this.entryData);

  public constructor() {
    const entryData =
      this._router.getCurrentNavigation()?.extras.state?.['entry'];

    entryData && this.entryData.set(entryData);
  }
}
