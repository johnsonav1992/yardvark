import {
  Component,
  computed,
  effect,
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
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { ChipDesignTokens } from '@primeng/themes/types/chip';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { capitalize } from '../../../utils/stringUtils';
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
import { TextareaModule } from 'primeng/textarea';
import { injectErrorToast } from '../../../utils/toastUtils';
import { GlobalUiService } from '../../../services/global-ui.service';
import { convertTimeStringToDate } from '../../../utils/timeUtils';
import { DatePickerModule } from 'primeng/datepicker';
import { format } from 'date-fns';
import { GalleriaModule } from 'primeng/galleria';
import { FileSelectEvent, FileUploadModule } from 'primeng/fileupload';
import { MAX_FILE_LARGE_UPLOAD_SIZE } from '../../../constants/file-constants';
import { FilesService } from '../../../services/files.service';
import { ConfirmationService } from 'primeng/api';

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
    TextareaModule,
    DatePickerModule,
    GalleriaModule,
    FileUploadModule
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
  private _globalUiService = inject(GlobalUiService);
  private _filesService = inject(FilesService);
  private _confirmationService = inject(ConfirmationService);

  public isMobile = this._globalUiService.isMobile;
  public maxFileUploadSize = MAX_FILE_LARGE_UPLOAD_SIZE;

  public editForm = new FormGroup({
    time: new FormControl<Date | null>(null),
    title: new FormControl<string>('', [Validators.required]),
    activities: new FormControl<Activity[]>([]),
    lawnSegments: new FormControl<LawnSegment[]>([]),
    products: new FormArray<EntryProductRow>([]),
    productsSelected: new FormControl<EntryProduct[]>([]),
    notes: new FormControl<string | null>(null),
    images: new FormControl<File[]>([])
  });

  public entryId = toSignal<number>(
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
  public isLoading = signal<boolean>(false);

  public entryTime = computed(() =>
    convertTimeStringToDate(this.entryData()?.time!)
  );

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

  public entryImageUrls = computed(
    () => this.entryData()?.images.map((img) => img.imageUrl) || []
  );

  public downloadedFiles = signal<File[]>([]);

  _formFileUpdater = effect(() => {
    const entryData = this.entryData();

    if (entryData && entryData.images.length) {
      this._filesService
        .downloadFiles(this.entryImageUrls())
        .subscribe((downloadedFiles) => {
          if (!downloadedFiles) return;

          this.downloadedFiles.set(downloadedFiles);
          this.editForm.controls.images.setValue(downloadedFiles);
          this.editForm.updateValueAndValidity();
        });
    }
  });

  public constructor() {
    const entryData =
      this._router.getCurrentNavigation()?.extras.state?.['entry'];

    entryData ? this.entryData.set(entryData) : this.shouldFetchEntry.set(true);
  }

  public deleteEntry() {
    const dateOfDeletedEntry = this.entryData()?.date;

    this._entryService.deleteEntry(this.entryId()!).subscribe(() => {
      this._router.navigate(['entry-log'], {
        queryParams: {
          date: new Date(dateOfDeletedEntry!)
        }
      });

      this._entryService.recentEntry.reload();
    });
  }

  public onFilesSelect(e: FileSelectEvent): void {
    if (!e.files || e.files.length === 0) return;

    const currentFiles = this.editForm.controls.images.value || [];
    const existingFileNames = new Set(currentFiles.map((file) => file.name));

    const newUniqueFiles = Array.from(e.files).filter(
      (file) => !existingFileNames.has(file.name)
    );

    const updatedFiles = [...currentFiles, ...newUniqueFiles];

    this.editForm.controls.images.setValue(updatedFiles);
    this.downloadedFiles.set(updatedFiles);
  }

  public onRemoveFile(
    file: File,
    removeFileCallback: (file: File, index: number) => void,
    index: number
  ) {
    const currentEntryImage = this.getCurrentEntryImage(file);

    const remove = () => {
      this.downloadedFiles.update((files) => {
        if (!files) return [];

        return files.toSpliced(index, 1);
      });

      this.editForm.controls.images.setValue(this.downloadedFiles() || []);
      this.editForm.controls.images.updateValueAndValidity();

      removeFileCallback(file, index);
    };

    if (currentEntryImage) {
      return this._confirmationService.confirm({
        header: 'Delete Existing Image',
        message:
          'Are you sure you want to delete this image? Since it already exists on this entry, you will need to upload it again if you want to keep it.',
        accept: () => {
          this._entryService.deleteEntryImage(currentEntryImage.id).subscribe();
          remove();
        }
      });
    }

    return remove();
  }

  public toggleEditMode() {
    this.isInEditMode.update((prevMode) => !prevMode);

    if (this.isInEditMode()) {
      this.editForm.patchValue({
        time: convertTimeStringToDate(this.entryData()?.time!),
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
      time: this.editForm.value.time
        ? format(this.editForm.value.time!, 'HH:mm:ss')
        : null,
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
      notes: this.editForm.value.notes || '',
      images: this.editForm.value.images?.filter(
        (img) => !this.getCurrentEntryImage(img)
      )
    };

    this.isLoading.set(true);

    this._entryService.editEntry(this.entryId(), updatedEntry).subscribe({
      next: () => {
        this.isInEditMode.set(false);
        this.isLoading.set(false);
        this.entryResource.reload();
        this._entryService.recentEntry.reload();
      },
      error: () => {
        this._throwErrorToast('Failed to update entry');
        this.isLoading.set(false);
      }
    });
  }

  private getCurrentEntryImage(file: File) {
    const fileName = file.name;

    return (
      this.entryData()?.images.find((img) => img.imageUrl.endsWith(fileName)) ||
      null
    );
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
