import {
  Component,
  computed,
  DestroyRef,
  inject,
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
import { MultiSelectModule } from 'primeng/multiselect';
import { TextareaModule } from 'primeng/textarea';
import { ActivitiesService } from '../../../services/activities.service';
import { capitalize } from '../../../utils/stringUtils';
import { Activity } from '../../../types/activities.types';
import { LawnSegment } from '../../../types/lawnSegments.types';
import { LawnSegmentsService } from '../../../services/lawn-segments.service';
import { InputTextModule } from 'primeng/inputtext';
import { Product } from '../../../types/products.types';
import { SelectModule } from 'primeng/select';
import { EntryProductRow } from '../../../utils/entriesUtils';
import { ProductsSelectorComponent } from '../../../components/products/products-selector/products-selector.component';
import { FileSelectEvent, FileUploadModule } from 'primeng/fileupload';
import { MAX_FILE_LARGE_UPLOAD_SIZE } from '../../../constants/file-constants';
import { ButtonModule } from 'primeng/button';
import {
  Accordion,
  AccordionPanel,
  AccordionHeader,
  AccordionContent
} from 'primeng/accordion';
import { TooltipModule } from 'primeng/tooltip';
import { PageContainerComponent } from '../../../components/layout/page-container/page-container.component';
import { SoilTemperatureService } from '../../../services/soil-temperature.service';
import { injectErrorToast } from '../../../utils/toastUtils';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { format } from 'date-fns';
import { EntriesService } from '../../../services/entries.service';
import { AnalyticsService } from '../../../services/analytics.service';
import { GlobalUiService } from '../../../services/global-ui.service';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { ACTIVITY_IDS } from '../../../constants/activity-constants';

export type EntryFormGroup = FormGroup<{
  title: FormControl<string>;
  date: FormControl<Date>;
  time: FormControl<Date | null>;
  activities: FormControl<Activity[]>;
  lawnSegments: FormControl<LawnSegment[]>;
  products: FormArray<EntryProductRow>;
  productsSelected: FormControl<Product[]>;
  notes: FormControl<string | null>;
  images: FormControl<File[]>;
  mowingHeight: FormControl<number | null>;
  hasMowingActivity: FormControl<boolean | null>;
}>;

@Component({
  selector: 'add-entry',
  imports: [
    DatePickerModule,
    MultiSelectModule,
    TextareaModule,
    ReactiveFormsModule,
    InputTextModule,
    FormsModule,
    SelectModule,
    ProductsSelectorComponent,
    FileUploadModule,
    ButtonModule,
    Accordion,
    AccordionPanel,
    AccordionHeader,
    AccordionContent,
    TooltipModule,
    PageContainerComponent
  ],
  templateUrl: './add-entry.component.html',
  styleUrl: './add-entry.component.scss'
})
export class AddEntryComponent implements OnInit {
  private _router = inject(Router);
  private _destroyRef = inject(DestroyRef);
  private _soilTempService = inject(SoilTemperatureService);
  private _entriesService = inject(EntriesService);
  private _analyticsService = inject(AnalyticsService);
  private _globalUiService = inject(GlobalUiService);
  private _activatedRoute = inject(ActivatedRoute);

  public activitiesResource = inject(ActivitiesService).activities;
  public lawnSegmentsResource = inject(LawnSegmentsService).lawnSegments;

  public throwErrorToast = injectErrorToast();

  public maxFileUploadSize = MAX_FILE_LARGE_UPLOAD_SIZE;
  public ACTIVITY_IDS = ACTIVITY_IDS;

  public isMobile = this._globalUiService.isMobile;
  public darkMode = this._globalUiService.isDarkMode;

  public initialDate = toSignal(
    this._activatedRoute.queryParams.pipe(
      map((params) => {
        const date = params['date'];
        if (date) {
          const parsedDate = new Date(date);
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate;
          }
        }
        return new Date();
      })
    ),
    { initialValue: new Date() }
  );

  public activities = computed(() =>
    this.activitiesResource
      .value()
      ?.map((act) => ({ ...act, name: capitalize(act.name) }))
  );

  public lawnSegments = computed(() => this.lawnSegmentsResource.value());

  public entryForms = new FormArray<EntryFormGroup>([]);
  public activeIndex = signal<number>(0);

  public isLoading = signal(false);
  public shouldFetchSoilData = signal(false);
  public soilTempDate = signal<Date | null>(null);
  public pointInTimeSoilTemperature =
    this._soilTempService.getPointInTimeSoilTemperature(
      this.shouldFetchSoilData,
      this.soilTempDate
    );

  public constructor() {
    this.addEntryForm();
  }

  public ngOnInit(): void {
    const date = this.initialDate();
    this.entryForms.at(0)?.patchValue({ date });

    this.shouldFetchSoilData.set(true);

    const firstForm = this.entryForms.at(0);

    firstForm?.controls.date.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(this.soilTempDate.set);

    if (firstForm?.value.date) {
      this.soilTempDate.set(firstForm.value.date);
    }
  }

  private createEntryForm(date?: Date): EntryFormGroup {
    const form = new FormGroup({
      title: new FormControl<string>('', { nonNullable: true }),
      date: new FormControl<Date>(date || new Date(), {
        nonNullable: true,
        validators: [Validators.required]
      }),
      time: new FormControl<Date | null>(null),
      activities: new FormControl<Activity[]>([], { nonNullable: true }),
      lawnSegments: new FormControl<LawnSegment[]>([], { nonNullable: true }),
      products: new FormArray<EntryProductRow>([]),
      productsSelected: new FormControl<Product[]>([], { nonNullable: true }),
      notes: new FormControl<string | null>(null),
      images: new FormControl<File[]>([], { nonNullable: true }),
      mowingHeight: new FormControl<number | null>(null),
      hasMowingActivity: new FormControl<boolean>(false)
    });

    form.controls.notes.valueChanges.subscribe((value) => {
      if (typeof value === 'string') {
        form.controls.notes.setValue(decodeURIComponent(value), {
          emitEvent: false
        });
      }
    });

    form.controls.activities.valueChanges.subscribe((activities) => {
      const hasMowing =
        activities?.some((activity) => activity.id === ACTIVITY_IDS.MOW) ??
        false;

      form.controls.hasMowingActivity.setValue(hasMowing);
    });

    return form;
  }

  public addEntryForm(date?: Date): void {
    this.entryForms.push(this.createEntryForm(date));
    this.activeIndex.set(this.entryForms.length - 1);
  }

  public removeEntryForm(index: number): void {
    if (this.entryForms.length > 1) {
      this.entryForms.removeAt(index);

      const currentIndex = this.activeIndex();

      if (currentIndex >= this.entryForms.length) {
        this.activeIndex.set(this.entryForms.length - 1);
      }
    }
  }

  public duplicateEntryForm(index: number): void {
    const formToDuplicate = this.entryForms.at(index);
    if (formToDuplicate) {
      const duplicatedForm = this.createEntryForm();
      const value = formToDuplicate.getRawValue();

      duplicatedForm.patchValue({
        ...value,
        title: '',
        notes: null,
        images: []
      });

      this.entryForms.insert(index + 1, duplicatedForm);
      this.activeIndex.set(index + 1);
    }
  }

  public onFilesSelect(e: FileSelectEvent, formIndex: number): void {
    if (!e.files || e.files.length === 0) return;

    const form = this.entryForms.at(formIndex);

    if (!form) return;

    const currentFiles = form.controls.images.value || [];
    const existingFileNames = new Set(currentFiles.map((file) => file.name));

    const newUniqueFiles = Array.from(e.files).filter(
      (file) => !existingFileNames.has(file.name)
    );

    form.controls.images.setValue([...currentFiles, ...newUniqueFiles]);
  }

  public onRemoveFile(
    file: File,
    removeFileCallback: (file: File, index: number) => void,
    index: number
  ) {
    removeFileCallback(file, index);
  }

  public onActiveIndexChange(
    value: string | number | string[] | number[] | null | undefined
  ): void {
    if (typeof value === 'number') {
      this.activeIndex.set(value);
    }
  }

  public back(): void {
    this._router.navigate(['/entry-log']);
  }

  public submit(): void {
    if (!this.entryForms || this.entryForms.invalid) {
      this.entryForms.controls.forEach((form) => {
        Object.entries(form.controls).forEach(([_, ctrl]) =>
          ctrl.markAsDirty()
        );
        form.markAllAsTouched();
      });

      return;
    }

    this.isLoading.set(true);

    const entries = this.entryForms.controls.map((form) => ({
      date: form.value.date!,
      time: form.value.time ? format(form.value.time!, 'HH:mm:ss') : null,
      notes: form.value.notes!,
      title: form.value.title!,
      soilTemperature:
        this.pointInTimeSoilTemperature.value()?.hourly
          .soil_temperature_6cm[0] || null,
      activityIds: form.value.activities?.map(({ id }) => id) || [],
      lawnSegmentIds: form.value.lawnSegments?.map(({ id }) => id) || [],
      products:
        form.value.products?.map((row) => ({
          productId: row.product?.id!,
          productQuantity: row.quantity!,
          productQuantityUnit: row.quantityUnit!
        })) || [],
      soilTemperatureUnit: this._soilTempService.temperatureUnit(),
      mowingHeight: form.value.mowingHeight ?? null,
      mowingHeightUnit: 'inches',
      images: form.value.images || []
    }));

    if (entries.length === 1) {
      this._entriesService.addEntry(entries[0]).subscribe({
        next: () => {
          this.isLoading.set(false);

          this._analyticsService.analyticsData.reload();
          this._entriesService.lastMow.reload();
          this._entriesService.recentEntry.reload();
          this._entriesService.lastProductApp.reload();

          const createdDate = entries[0].date.toISOString();

          this._router.navigate(['/entry-log'], {
            queryParams: { date: createdDate }
          });
        },
        error: (error) => {
          this.isLoading.set(false);
          if (error.status === 402) {
            this.throwErrorToast(
              error.error.message || 'Entry limit reached. Upgrade for unlimited entries.'
            );
            this._router.navigate(['/subscription']);
          } else {
            this.throwErrorToast('Failed to create entry');
          }
        }
      });
    } else {
      this._entriesService.addEntriesBatch(entries).subscribe({
        next: (response) => {
          this.isLoading.set(false);

          if (response.failed > 0) {
            this.throwErrorToast(
              `Created ${response.created} entries, ${response.failed} failed`
            );
          }

          this._analyticsService.analyticsData.reload();
          this._entriesService.lastMow.reload();
          this._entriesService.recentEntry.reload();
          this._entriesService.lastProductApp.reload();

          const latestDate = entries
            .map((e) => new Date(e.date))
            .sort((a, b) => b.getTime() - a.getTime())[0];

          this._router.navigate(['/entry-log'], {
            queryParams: { date: latestDate.toISOString() }
          });
        },
        error: (error) => {
          this.isLoading.set(false);
          if (error.status === 402) {
            this.throwErrorToast(
              error.error.message || 'Entry limit reached. Upgrade for unlimited entries.'
            );
            this._router.navigate(['/subscription']);
          } else {
            this.throwErrorToast('Failed to create entries');
          }
        }
      });
    }
  }
}
