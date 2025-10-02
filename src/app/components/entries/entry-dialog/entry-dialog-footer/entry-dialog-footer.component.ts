import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { EntryDialogComponent } from '../entry-dialog.component';
import { injectUserData } from '../../../../utils/authUtils';
import { SoilTemperatureService } from '../../../../services/soil-temperature.service';
import { injectErrorToast } from '../../../../utils/toastUtils';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { format } from 'date-fns';
import { EntriesService } from '../../../../services/entries.service';
import { AnalyticsService } from '../../../../services/analytics.service';

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
  private _entriesService = inject(EntriesService);
  private _analyticsService = inject(AnalyticsService);
  private throwErrorToast = injectErrorToast();

  public user = injectUserData();

  public entryForms: InstanceType<typeof EntryDialogComponent>['entryForms'] | null = null;

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
        this.entryForms = comp.entryForms;

        this.shouldFetchSoilData.set(true);

        const firstForm = this.entryForms?.at(0);
        firstForm?.controls.date.valueChanges
          .pipe(takeUntilDestroyed(this._destroyRef))
          .subscribe(this.soilTempDate.set);
      });
  }

  public close(): void {
    if (!this.entryForms || this.entryForms.invalid) return;

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
      images: form.value.images || []
    }));

    if (entries.length === 1) {
      this._entriesService.addEntry(entries[0]).subscribe({
        next: () => {
          this.isLoading.set(false);
          this._dialogRef.close(entries[0].date!);

          // TODO: Find a way to refetch these more efficiently
          this._analyticsService.analyticsData.reload();
          this._entriesService.lastMow.reload();
          this._entriesService.recentEntry.reload();
          this._entriesService.lastProductApp.reload();
        },
        error: () => {
          this.isLoading.set(false);
          this.throwErrorToast('Failed to create entry');
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

          const latestDate = entries
            .map((e) => new Date(e.date))
            .sort((a, b) => b.getTime() - a.getTime())[0];

          this._dialogRef.close(latestDate);

          // TODO: Find a way to refetch these more efficiently
          this._analyticsService.analyticsData.reload();
          this._entriesService.lastMow.reload();
          this._entriesService.recentEntry.reload();
          this._entriesService.lastProductApp.reload();
        },
        error: () => {
          this.isLoading.set(false);
          this.throwErrorToast('Failed to create entries');
        }
      });
    }
  }
}
