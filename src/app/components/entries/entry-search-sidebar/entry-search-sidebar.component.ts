import { Component, computed, inject, model, signal } from '@angular/core';
import { DividerModule } from 'primeng/divider';
import { DrawerModule } from 'primeng/drawer';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ActivitiesService } from '../../../services/activities.service';
import { FloatLabelModule } from 'primeng/floatlabel';
import { LawnSegmentsService } from '../../../services/lawn-segments.service';
import { ProductsService } from '../../../services/products.service';
import { GlobalUiService } from '../../../services/global-ui.service';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Activity } from '../../../types/activities.types';
import { LawnSegment } from '../../../types/lawnSegments.types';
import { Product } from '../../../types/products.types';
import { EntriesService } from '../../../services/entries.service';
import { TooltipModule } from 'primeng/tooltip';
import { LoadingSpinnerComponent } from '../../miscellanious/loading-spinner/loading-spinner.component';
import { MobileEntryPreviewCardComponent } from '../mobile-entry-preview-card/mobile-entry-preview-card.component';
import { convertTimeStringToDate } from '../../../utils/timeUtils';
import { format } from 'date-fns';
import { Entry } from '../../../types/entries.types';

@Component({
  selector: 'entry-search-sidebar',
  imports: [
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    DrawerModule,
    DividerModule,
    MultiSelectModule,
    FloatLabelModule,
    DatePickerModule,
    ButtonModule,
    ReactiveFormsModule,
    TooltipModule,
    LoadingSpinnerComponent,
    MobileEntryPreviewCardComponent
  ],
  templateUrl: './entry-search-sidebar.component.html',
  styleUrl: './entry-search-sidebar.component.scss'
})
export class EntrySearchSidebarComponent {
  private _activitiesService = inject(ActivitiesService);
  private _lawnSegmentsService = inject(LawnSegmentsService);
  private _productsService = inject(ProductsService);
  private _globalUiService = inject(GlobalUiService);
  private _entriesService = inject(EntriesService);

  public activities = this._activitiesService.activities;
  public lawnSegments = this._lawnSegmentsService.lawnSegments;
  public products = this._productsService.products;

  public isMobile = this._globalUiService.isMobile;

  public isOpen = model(false);

  public isLoading = signal(false);
  public results = signal<Entry[] | null>(null);

  public displayedEntries = computed(() => {
    return this.results()?.map((entry) => {
      const time = entry.time
        ? (convertTimeStringToDate(entry.time) as Date)
        : '';

      return {
        ...entry,
        time: time ? format(time, 'hh:mm a') : ''
      };
    });
  });

  public form = new FormGroup({
    titleOrNotes: new FormControl(''),
    dates: new FormControl<Date[]>([]),
    activities: new FormControl<Activity['id'][]>([]),
    lawnSegments: new FormControl<LawnSegment['id'][]>([]),
    products: new FormControl<Product['id'][]>([])
  });

  public onCloseSidebar(): void {
    this.form.reset();
    this.results.set(null);
  }

  public submit(): void {
    this.isLoading.set(true);

    this._entriesService
      .searchEntries({
        titleOrNotes: this.form.value.titleOrNotes!,
        dateRange: this.form.value.dates?.map((date) => date.toISOString())!,
        activities: this.form.value.activities!,
        lawnSegments: this.form.value.lawnSegments!,
        products: this.form.value.products!
      })
      .subscribe({
        next: (entries) => {
          this.isLoading.set(false);
          this.results.set(entries);
        },
        error: () => {
          console.error('Error searching entries');
          this.isLoading.set(false);
        }
      });
  }
}
