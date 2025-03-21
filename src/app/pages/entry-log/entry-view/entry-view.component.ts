import {
  Component,
  computed,
  inject,
  linkedSignal,
  signal
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Entry,
  EntryCreationRequest,
  EntryProduct
} from '../../../types/entries.types';
import { PageContainerComponent } from '../../../components/layout/page-container/page-container.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { apiUrl, deleteReq, putReq } from '../../../utils/httpUtils';
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
import { MultiSelectModule } from 'primeng/multiselect';
import { ActivitiesService } from '../../../services/activities.service';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Activity } from '../../../types/activities.types';
import { LawnSegment } from '../../../types/lawnSegments.types';
import {
  createEntryProductRow,
  EntryProductRow
} from '../../../utils/entriesUtils';
import { InputTextModule } from 'primeng/inputtext';
import { LawnSegmentsService } from '../../../services/lawn-segments.service';
import { ProductsSelectorComponent } from '../../../components/products/products-selector/products-selector.component';
import { Product } from '../../../types/products.types';
import { TextareaModule } from 'primeng/textarea';
import { injectErrorToast } from '../../../utils/toastUtils';

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
    ProductSmallCardComponent,
    MultiSelectModule,
    InputTextModule,
    ProductsSelectorComponent,
    ReactiveFormsModule,
    TextareaModule
  ],
  templateUrl: './entry-view.component.html',
  styleUrl: './entry-view.component.scss'
})
export class EntryViewComponent {
  private _router = inject(Router);
  private _activatedRoute = inject(ActivatedRoute);
  private _entryService = inject(EntriesService);
  private _activitiesService = inject(ActivitiesService);
  private _lawnSegmentsService = inject(LawnSegmentsService);
  private _throwErrorToast = injectErrorToast();

  public editForm = new FormGroup({
    title: new FormControl<string>('', [Validators.required]),
    activities: new FormControl<Activity[]>([]),
    lawnSegments: new FormControl<LawnSegment[]>([]),
    products: new FormArray<EntryProductRow>([]),
    productsSelected: new FormControl<EntryProduct[]>([]),
    notes: new FormControl<string | null>(null)
  });

  public entryId = toSignal(
    this._activatedRoute.params.pipe(map((params) => params['entryId']))
  );

  public entryDate = toSignal(
    this._activatedRoute.queryParams.pipe(
      map((params) => params['date'] as string)
    )
  );

  public shouldFetchEntry = signal<boolean>(false);
  public entryData = linkedSignal<Entry | undefined>(() =>
    this.entryResource.value()
  );
  public isInEditMode = signal(false);

  public currentDate = computed<Date | null>(() =>
    this.entryDate() ? new Date(this.entryDate()!) : null
  );

  public allActivities = this._activitiesService.activities;
  public allLawnSegments = this._lawnSegmentsService.lawnSegments;
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

  public toggleEditMode() {
    this.isInEditMode.update((prevMode) => !prevMode);

    if (this.isInEditMode()) {
      this.editForm.patchValue({
        title: this.entryData()?.title,
        activities: this.entryData()?.activities,
        lawnSegments: this.entryData()?.lawnSegments,
        productsSelected: this.entryData()?.products,
        notes: this.entryData()?.notes
      });

      if (!this.editForm.controls.products.length) {
        this.entryData()?.products.forEach((prod) => {
          this.editForm.controls.products.push(createEntryProductRow(prod));
        });
      }

      this.editForm.updateValueAndValidity();
    }
  }

  public submitEdits() {
    const updatedEntry: Partial<EntryCreationRequest> = {
      title: this.editForm.value.title || '',
      activityIds: this.editForm.value.activities?.map(({ id }) => id) || [],
      lawnSegmentIds:
        this.editForm.value.lawnSegments?.map(({ id }) => id) || [],
      products:
        this.editForm?.value.products?.map((row) => ({
          productId: row.product?.id!,
          productQuantity: row.quantity!,
          productQuantityUnit: row.quantityUnit!
        })) || [],
      notes: this.editForm.value.notes || ''
    };

    putReq(
      apiUrl('entries', { params: [this.entryId()] }),
      updatedEntry
    ).subscribe({
      next: () => {
        this.isInEditMode.set(false);
        this.entryResource.reload();
      },
      error: () => this._throwErrorToast('Failed to update entry')
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
