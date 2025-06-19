import { Component, inject, OnInit, signal } from '@angular/core';
import { PageContainerComponent } from '../../../components/layout/page-container/page-container.component';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { FileSelectEvent, FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import {
	FormControl,
	FormGroup,
	ReactiveFormsModule,
	Validators
} from '@angular/forms';
import { showAllFormErrorsOnSubmit } from '../../../utils/formUtils';
import { SelectModule } from 'primeng/select';
import { Location } from '@angular/common';
import { injectErrorToast } from '../../../utils/toastUtils';
import { GlobalUiService } from '../../../services/global-ui.service';
import { CheckboxModule } from 'primeng/checkbox';
import { injectUserData } from '../../../utils/authUtils';
import { EquipmentService } from '../../../services/equipment.service';
import { DatePickerModule } from 'primeng/datepicker';
import { EquipmentFormData } from '../../../types/equipment.types';
import { ActivatedRoute } from '@angular/router';
import { MAX_FILE_UPLOAD_SIZE } from '../../../constants/file-constants';

@Component({
	selector: 'add-edit-equipment',
	imports: [
		PageContainerComponent,
		InputTextModule,
		TextareaModule,
		InputNumberModule,
		FileUploadModule,
		ButtonModule,
		SelectModule,
		ReactiveFormsModule,
		CheckboxModule,
		DatePickerModule
	],
	templateUrl: './add-edit-equipment.component.html',
	styleUrl: './add-edit-equipment.component.scss'
})
export class AddEditEquipmentComponent implements OnInit {
	private _location = inject(Location);
	private _equipmentService = inject(EquipmentService);
	private _globalUiService = inject(GlobalUiService);
	private _route = inject(ActivatedRoute);
	public user = injectUserData();

	public throwErrorToast = injectErrorToast();

	public maxFileUploadSize = MAX_FILE_UPLOAD_SIZE;

	public isMobile = this._globalUiService.isMobile;

	public equipmentId = this._route.snapshot.paramMap.get('equipmentId');

	public form = new FormGroup({
		name: new FormControl('', [Validators.required]),
		brand: new FormControl('', [Validators.required]),
		model: new FormControl(''),
		description: new FormControl(''),
		serialNumber: new FormControl(''),
		purchaseDate: new FormControl<Date | null>(null),
		purchasePrice: new FormControl<number | null>(null, [
			Validators.min(0),
			Validators.max(99999999)
		]),
		fuelType: new FormControl(''),
		image: new FormControl<File | null>(null)
	});

	public equipmentToEdit = this.equipmentId
		? this._equipmentService.equipment
				.value()
				?.find((equipment) => equipment.id === +this.equipmentId!)
		: null;

	public isLoading = signal(false);

	public ngOnInit(): void {
		if (this.equipmentToEdit) {
			this.form.patchValue({
				...this.equipmentToEdit,
				purchaseDate: this.equipmentToEdit.purchaseDate
					? new Date(this.equipmentToEdit.purchaseDate)
					: null,
				image: null // TODO
			});
		}
	}

	public fileUpload(e: FileSelectEvent): void {
		const file = e.files[0];

		this.form.patchValue({ image: file });
	}

	public fileClear(): void {
		this.form.patchValue({ image: null });
	}

	public back(): void {
		this._location.back();
	}

	public submit(): void {
		if (this.form.invalid) return showAllFormErrorsOnSubmit(this.form);

		this.isLoading.set(true);

		const equipment = this.form.value as EquipmentFormData;

		const action$ = this.equipmentId
			? this._equipmentService.updateEquipment(+this.equipmentId, equipment)
			: this._equipmentService.createEquipment(equipment);

		action$.subscribe({
			next: () => {
				this.isLoading.set(false);
				this._equipmentService.equipment.reload();
				this.back();
			},
			error: () => {
				this.isLoading.set(false);
				this.throwErrorToast(
					`Error ${this.equipmentId ? 'updating' : 'creating'} equipment. Please try again.`
				);
			}
		});
	}
}
