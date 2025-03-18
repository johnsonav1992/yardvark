import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { EntryDialogComponent } from '../entry-dialog.component';
import { apiUrl, postReq } from '../../../utils/httpUtils';
import { injectUserData } from '../../../utils/authUtils';
import { SoilTemperatureService } from '../../../services/soil-temperature.service';
import { calculate24HourNumericAverage } from '../../../utils/soilTemperatureUtils';
import { EntryCreationRequest } from '../../../types/entries.types';
import { injectErrorToast } from '../../../utils/toastUtils';

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

  constructor() {
    const compSub = this._dialogRef.onChildComponentLoaded.subscribe(
      (comp) => (this.form = comp.form)
    );

    this._destroyRef.onDestroy(() => compSub.unsubscribe());
  }

  public close(): void {
    console.log(this.form?.value);
    if (this.form?.invalid) return;

    console.log(this.form?.value);

    // this.isLoading.set(true);

    // postReq<void, EntryCreationRequest>(apiUrl('entries'), {
    //   date: this.form?.value.date!,
    //   notes: this.form?.value.notes!,
    //   title: this.form?.value.title!,
    //   userId: this.user()?.sub!,
    //   soilTemperature: calculate24HourNumericAverage(
    //     this._soilTempService.past24HourSoilTemperatureData.value()?.hourly
    //       .soil_temperature_6cm || []
    //   ),
    //   activityIds: this.form?.value.activities?.map(({ id }) => id) || [],
    //   lawnSegmentIds: this.form?.value.lawnSegments?.map(({ id }) => id) || [],
    //   products:
    //     this.form?.value.products?.map((row) => ({
    //       productId: row.product?.id,
    //       productQuantity: row.quantity,
    //       productQuantityUnit: row.quantityUnit
    //     })) || [],
    //   soilTemperatureUnit: this._soilTempService.temperatureUnit()
    // }).subscribe({
    //   next: () => {
    //     this.isLoading.set(false);
    //     this._dialogRef.close('success');
    //   },
    //   error: () => {
    //     this.isLoading.set(false);
    //     this.throwErrorToast('Failed to create entry');
    //   }
    // });
  }
}
