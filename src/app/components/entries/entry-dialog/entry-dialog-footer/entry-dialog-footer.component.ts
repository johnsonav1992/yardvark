import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { EntryDialogComponent } from '../entry-dialog.component';
import { apiUrl, postReq } from '../../../../utils/httpUtils';
import { injectUserData } from '../../../../utils/authUtils';
import { SoilTemperatureService } from '../../../../services/soil-temperature.service';
import { EntryCreationRequest } from '../../../../types/entries.types';
import { injectErrorToast } from '../../../../utils/toastUtils';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'entry-dialog-footer',
  imports: [ButtonModule],
  templateUrl: './entry-dialog-footer.component.html',
  styleUrl: './entry-dialog-footer.component.scss'
})
export class EntryDialogFooterComponent {
  private _destroyRef = inject(DestroyRef);
  private _dialogRef = inject(DynamicDialogRef<EntryDialogComponent>);
  private _soilTempService = inject(SoilTemperatureService);
  private throwErrorToast = injectErrorToast();

  public user = injectUserData();

  public form: InstanceType<typeof EntryDialogComponent>['form'] | null = null;

  public isLoading = signal(false);
  public shouldFetchSoilData = signal(false);
  public soilTempDate = signal<Date | null>(null);
  public pointInTimeSoilTemperature =
    this._soilTempService.getPointInTimeSoilTemperature(
      this.shouldFetchSoilData,
      this.soilTempDate
    );

  constructor() {
    this._dialogRef.onChildComponentLoaded
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((comp) => {
        this.form = comp.form;

        this.shouldFetchSoilData.set(true);

        this.form?.controls.date.valueChanges
          .pipe(takeUntilDestroyed(this._destroyRef))
          .subscribe(this.soilTempDate.set);
      });
  }

  public close(): void {
    if (this.form?.invalid) return;

    this.isLoading.set(true);

    postReq<void, EntryCreationRequest>(apiUrl('entries'), {
      date: this.form?.value.date!,
      notes: this.form?.value.notes!,
      title: this.form?.value.title!,
      soilTemperature:
        this.pointInTimeSoilTemperature.value()?.hourly
          .soil_temperature_6cm[0] || null,
      activityIds: this.form?.value.activities?.map(({ id }) => id) || [],
      lawnSegmentIds: this.form?.value.lawnSegments?.map(({ id }) => id) || [],
      products:
        this.form?.value.products?.map((row) => ({
          productId: row.product?.id,
          productQuantity: row.quantity,
          productQuantityUnit: row.quantityUnit
        })) || [],
      soilTemperatureUnit: this._soilTempService.temperatureUnit()
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this._dialogRef.close('success');
      },
      error: () => {
        this.isLoading.set(false);
        this.throwErrorToast('Failed to create entry');
      }
    });
  }
}
