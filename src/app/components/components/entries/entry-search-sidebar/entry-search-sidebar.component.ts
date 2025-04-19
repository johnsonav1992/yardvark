import { Component, inject, model } from '@angular/core';
import { DividerModule } from 'primeng/divider';
import { DrawerModule } from 'primeng/drawer';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ActivitiesService } from '../../../../services/activities.service';
import { FloatLabelModule } from 'primeng/floatlabel';
import { LawnSegmentsService } from '../../../../services/lawn-segments.service';
import { ProductsService } from '../../../../services/products.service';
import { GlobalUiService } from '../../../../services/global-ui.service';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Activity } from '../../../../types/activities.types';
import { LawnSegment } from '../../../../types/lawnSegments.types';
import { Product } from '../../../../types/products.types';
import { EntriesService } from '../../../../services/entries.service';

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
    ReactiveFormsModule
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

  public form = new FormGroup({
    titleOrDescription: new FormControl(''),
    dates: new FormControl<Date[]>([]),
    activities: new FormControl<Activity['id'][]>([]),
    lawnSegments: new FormControl<LawnSegment['id'][]>([]),
    products: new FormControl<Product['id'][]>([])
  });

  public submit(): void {
    console.log(this.form.value);

    this._entriesService
      .searchEntries({
        titleOrDescription: this.form.value.titleOrDescription!,
        dateRange: this.form.value.dates?.map((date) => date.toISOString())!,
        activities: this.form.value.activities!,
        lawnSegments: this.form.value.lawnSegments!,
        products: this.form.value.products!
      })
      .subscribe((response) => {
        console.log(response);
      });
  }
}
