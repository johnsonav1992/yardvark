import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal
} from '@angular/core';
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
import { ActivitiesService } from '../../services/activities.service';
import { capitalize } from '../../utils/stringUtils';
import { Activity } from '../../types/activities.types';
import { LawnSegment } from '../../types/lawnSegments.types';
import { LawnSegmentsService } from '../../services/lawn-segments.service';
import { InputTextModule } from 'primeng/inputtext';
import { ProductsService } from '../../services/products.service';
import { Product } from '../../types/products.types';
import { SelectModule } from 'primeng/select';
import { QUANTITY_UNITS } from '../../constants/product-constants';
import { InputNumber } from 'primeng/inputnumber';
import { createEntryProductRow } from '../../utils/entriesUtils';

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
    InputNumber
  ],
  templateUrl: './entry-dialog.component.html',
  styleUrl: './entry-dialog.component.scss'
})
export class EntryDialogComponent implements OnInit {
  public activitiesResource = inject(ActivitiesService).activities;
  public lawnSegmentsResource = inject(LawnSegmentsService).lawnSegments;
  public products = inject(ProductsService).products;

  public quantityUnits = QUANTITY_UNITS;

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
    products: new FormArray<ReturnType<typeof createEntryProductRow>>([]),
    notes: new FormControl<string | null>(null)
  });

  public ngOnInit(): void {
    this.form.patchValue({
      date: this.date()
    });
  }

  public addProductToForm(e: MultiSelectChangeEvent): void {
    const product = e.itemValue as Product | undefined;
    const fullList = e.value as Product[];

    if (!product && fullList.length) {
      const existingProducts = this.form.controls.products.value;

      fullList.forEach((prod) => {
        const existingProductIndex = existingProducts.findIndex(
          (p) => p.product?.id === prod.id
        );

        if (existingProductIndex === -1) {
          this.form.controls.products.push(createEntryProductRow(prod));
        }
      });

      return;
    }

    const productIndex = this.form.controls.products.value.findIndex(
      (p) => p.product?.id === product?.id
    );

    if (productIndex !== -1) {
      this.form.controls.products.removeAt(productIndex);
    } else {
      this.form.controls.products.push(createEntryProductRow(product));
    }
  }
}
