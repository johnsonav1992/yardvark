import { Component, inject, input, OnInit } from '@angular/core';
import {
	FormControl,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { showAllFormErrorsOnSubmit } from '../../../utils/formUtils';
import { EquipmentService } from '../../../services/equipment.service';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { injectErrorToast } from '../../../utils/toastUtils';

@Component({
	selector: 'equipment-maintenance-add-edit-modal',
	imports: [
		InputTextModule,
		FloatLabelModule,
		InputIconModule,
		IconFieldModule,
		DatePickerModule,
		InputNumberModule,
		TextareaModule,
		ButtonModule,
		ReactiveFormsModule,
	],
	templateUrl: './equipment-maintenance-add-edit-modal.component.html',
	styleUrl: './equipment-maintenance-add-edit-modal.component.scss',
})
export class EquipmentMaintenanceAddEditModalComponent implements OnInit {
	private _equipmentService = inject(EquipmentService);
	private _dialogRef = inject(DynamicDialogRef);
	public throwErrorToast = injectErrorToast();

	public date = input<Date>();
	public notes = input<string>();
	public cost = input<number>();
	public equipmentId = input<number>();
	public maintenanceId = input<number>();

	public form = new FormGroup({
		date: new FormControl<Date | null>(null, [Validators.required]),
		cost: new FormControl<number | null>(null),
		notes: new FormControl('', [Validators.required]),
	});

	public ngOnInit(): void {
		this.form.patchValue({
			date: this.date(),
			notes: this.notes(),
			cost: this.cost(),
		});
	}

	public closeModal(): void {
		this._dialogRef.close();
	}

	public submit(): void {
		if (this.form.invalid) {
			return showAllFormErrorsOnSubmit(this.form);
		}

		const maintenanceId = this.maintenanceId();

		if (maintenanceId) {
			this._equipmentService
				.updateMaintenanceRecord(maintenanceId, {
					maintenanceDate: this.form.value.date!,
					notes: this.form.value.notes!,
					cost: this.form.value.cost!,
				})
				.subscribe({
					next: () => {
						this._dialogRef.close('success');
					},
					error: () => {
						this.throwErrorToast(
							'Error updating maintenance record. Please try again.',
						);
					},
				});
		} else {
			this._equipmentService
				.addMaintenanceRecord(this.equipmentId()!, {
					maintenanceDate: this.form.value.date!,
					notes: this.form.value.notes!,
					cost: this.form.value.cost!,
				})
				.subscribe({
					next: () => {
						this._dialogRef.close('success');
					},
					error: () => {
						this.throwErrorToast(
							'Error adding maintenance record. Please try again.',
						);
					},
				});
		}
	}
}
