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
import { ProductsSelectorComponent } from '../../products/products-selector/products-selector.component';
import { FileSelectEvent, FileUploadModule } from 'primeng/fileupload';
import { MAX_FILE_LARGE_UPLOAD_SIZE } from '../../../constants/file-constants';
import { ButtonModule } from 'primeng/button';
import { Accordion, AccordionPanel, AccordionHeader, AccordionContent } from 'primeng/accordion';
import { TooltipModule } from 'primeng/tooltip';

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
}>;

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
    ProductsSelectorComponent,
    FileUploadModule,
    ButtonModule,
    Accordion,
    AccordionPanel,
    AccordionHeader,
    AccordionContent,
    TooltipModule
  ],
  templateUrl: './entry-dialog.component.html',
  styleUrl: './entry-dialog.component.scss'
})
export class EntryDialogComponent implements OnInit {
  public activitiesResource = inject(ActivitiesService).activities;
  public lawnSegmentsResource = inject(LawnSegmentsService).lawnSegments;

  public maxFileUploadSize = MAX_FILE_LARGE_UPLOAD_SIZE;

  public date = input<Date>();

  public activities = computed(() =>
    this.activitiesResource
      .value()
      ?.map((act) => ({ ...act, name: capitalize(act.name) }))
  );

  public lawnSegments = computed(() => this.lawnSegmentsResource.value());

  public entryForms = new FormArray<EntryFormGroup>([]);
  public activeIndex = signal<number>(0);

  public constructor() {
    this.addEntryForm();
  }

  public ngOnInit(): void {
    const initialDate = this.date() || new Date();
    this.entryForms.at(0)?.patchValue({ date: initialDate });
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
      images: new FormControl<File[]>([], { nonNullable: true })
    });

    form.controls.notes.valueChanges.subscribe((value) => {
      if (typeof value === 'string') {
        form.controls.notes.setValue(decodeURIComponent(value), {
          emitEvent: false
        });
      }
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

  public onActiveIndexChange(value: string | number | string[] | number[] | null | undefined): void {
    if (typeof value === 'number') {
      this.activeIndex.set(value);
    }
  }
}
