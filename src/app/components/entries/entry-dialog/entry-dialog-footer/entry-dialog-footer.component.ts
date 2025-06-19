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
	styleUrl: './entry-dialog-footer.component.scss',
})
export class EntryDialogFooterComponent {
	private _destroyRef = inject(DestroyRef);
	private _dialogRef = inject(DynamicDialogRef<EntryDialogComponent>);
	private _soilTempService = inject(SoilTemperatureService);
	private _entriesService = inject(EntriesService);
	private _analyticsService = inject(AnalyticsService);
	private throwErrorToast = injectErrorToast();

	public user = injectUserData();

	public form: InstanceType<typeof EntryDialogComponent>['form'] | null = null;

	public isLoading = signal(false);
	public shouldFetchSoilData = signal(false);
	public soilTempDate = signal<Date | null>(null);
	public pointInTimeSoilTemperature =
		this._soilTempService.getPointInTimeSoilTemperature(
			this.shouldFetchSoilData,
			this.soilTempDate,
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

		const req = {
			date: this.form?.value.date!,
			time: this.form?.value.time
				? format(this.form?.value.time!, 'HH:mm:ss')
				: null,
			notes: this.form?.value.notes!,
			title: this.form?.value.title!,
			soilTemperature:
				this.pointInTimeSoilTemperature.value()?.hourly
					.soil_temperature_6cm[0] || null,
			activityIds: this.form?.value.activities?.map(({ id }) => id) || [],
			lawnSegmentIds: this.form?.value.lawnSegments?.map(({ id }) => id) || [],
			products:
				this.form?.value.products?.map((row) => ({
					productId: row.product?.id!,
					productQuantity: row.quantity!,
					productQuantityUnit: row.quantityUnit!,
				})) || [],
			soilTemperatureUnit: this._soilTempService.temperatureUnit(),
			images: this.form?.value.images || [],
		};

		this._entriesService.addEntry(req).subscribe({
			next: () => {
				this.isLoading.set(false);
				this._dialogRef.close(this.form?.value.date!);

				// TODO: Find a way to refetch these more efficiently
				this._analyticsService.analyticsData.reload();
				this._entriesService.lastMow.reload();
				this._entriesService.recentEntry.reload();
				this._entriesService.lastProductApp.reload();
			},
			error: () => {
				this.isLoading.set(false);
				this.throwErrorToast('Failed to create entry');
			},
		});
	}
}
