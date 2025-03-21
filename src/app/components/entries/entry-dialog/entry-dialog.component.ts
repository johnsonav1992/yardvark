import { Component, computed, inject, input, OnInit } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { MultiSelectChangeEvent, MultiSelectModule } from 'primeng/multiselect';
import { TextareaModule } from 'primeng/textarea';
import { ActivitiesService } from '../../../services/activities.service';
import { capitalize } from '../../../utils/stringUtils';
import { Activity } from '../../../types/activities.types';
import { LawnSegment } from '../../../types/lawnSegments.types';
import { LawnSegmentsService } from '../../../services/lawn-segments.service';
import { InputTextModule } from 'primeng/inputtext';
import { ProductsService } from '../../../services/products.service';
import { Product } from '../../../types/products.types';
import { SelectModule } from 'primeng/select';
import { QUANTITY_UNITS } from '../../../constants/product-constants';
import {
  createEntryProductRow,
  EntryProductRow
} from '../../../utils/entriesUtils';
import { ProductsSelectorComponent } from '../../products/products-selector/products-selector.component';

@Component({
  selector: 'entry-dialog',
  imports: [
    DatePickerModule,
    MultiSelectModule,
    TextareaModule,
    ReactiveFormsModule,
    InputTextModule,
    FormsModule,
    SelectModule,
    ProductsSelectorComponent
  ],
  templateUrl: './entry-dialog.component.html',
  styleUrl: './entry-dialog.component.scss'
})
export class EntryDialogComponent implements OnInit {
  public activitiesResource = inject(ActivitiesService).activities;
  public lawnSegmentsResource = inject(LawnSegmentsService).lawnSegments;

  public date = input<Date>();

  public activities = computed(() =>
    this.activitiesResource
      .value()
      ?.map((act) => ({ ...act, name: capitalize(act.name) }))
  );

  public lawnSegments = computed(() => this.lawnSegmentsResource.value());

  public form = new FormGroup({
    title: new FormControl<string>('', [Validators.required]),
    date: new FormControl(new Date(), [Validators.required]),
    activities: new FormControl<Activity[]>([]),
    lawnSegments: new FormControl<LawnSegment[]>([]),
    products: new FormArray<EntryProductRow>([]),
    productsSelected: new FormControl<Product[]>([]), // Noop for this view to make Angular forms + primeng happy
    notes: new FormControl<string | null>(null)
  });

  public ngOnInit(): void {
    this.form.patchValue({
      date: this.date()
    });
  }
}
