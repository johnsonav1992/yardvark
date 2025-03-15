import { Component, DestroyRef, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { EntryDialogComponent } from '../entry-dialog.component';
import { apiUrl, postReq } from '../../../utils/httpUtils';
import { injectUserData } from '../../../utils/authUtils';
import { SoilTemperatureService } from '../../../services/soil-temperature.service';
import { calculate24HourNumericAverage } from '../../../utils/soilTemperatureUtils';
import { EntryCreationRequest } from '../../../types/entries.types';

@Component({
  selector: 'entry-dialog-footer',
  imports: [ButtonModule],
  templateUrl: './entry-dialog-footer.component.html',
  styleUrl: './entry-dialog-footer.component.scss'
})
export class EntryDialogFooterComponent {
  private _destroyRef = inject(DestroyRef);
  private _dialogRef = inject(DynamicDialogRef<EntryDialogComponent>);
  private _dialogData = inject(DynamicDialogConfig).data;
  private _soilTempService = inject(SoilTemperatureService);

  public user = injectUserData();

  public form: InstanceType<typeof EntryDialogComponent>['form'] | null = null;

  constructor() {
    const compSub = this._dialogRef.onChildComponentLoaded.subscribe(
      (comp) => (this.form = comp.form)
    );

    this._destroyRef.onDestroy(() => compSub.unsubscribe());
  }

  public close(): void {
    console.log(this.form?.value);

    if (this.form?.invalid) return;

    postReq(apiUrl('entries'), {
      date: this.form?.value.date!,
      notes: this.form?.value.notes!,
      title: 'A title',
      userId: this.user()?.sub!,
      soilTemperature: calculate24HourNumericAverage(
        this._soilTempService.past24HourSoilTemperatureData.value()?.hourly
          .soil_temperature_6cm || []
      ),
      activityIds: this.form?.value.activities?.map(({ id }) => id) || [],
      lawnSegmentIds: this.form?.value.lawnSegments?.map(({ id }) => id) || [],
      soilTemperatureUnit: this._soilTempService.temperatureUnit()
    } satisfies EntryCreationRequest).subscribe({
      next: () => this._dialogRef.close('success')
    });

    // this._dialogRef.close();
  }
}
