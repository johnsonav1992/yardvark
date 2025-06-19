import { Component, computed, inject, signal } from '@angular/core';
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
	Validators,
} from '@angular/forms';
import {
	applicationRateFieldValidator,
	guaranteedAnalysisFieldValidator,
	websiteUrlValidator,
} from '../../../utils/formUtils';
import {
	APPLICATION_METHODS,
	CONTAINER_TYPES,
	COVERAGE_UNITS,
	PRODUCT_CATEGORIES,
	QUANTITY_UNITS,
} from '../../../constants/product-constants';
import { SelectModule } from 'primeng/select';
import { Location } from '@angular/common';
import { ProductsService } from '../../../services/products.service';
import { injectErrorToast } from '../../../utils/toastUtils';
import { GlobalUiService } from '../../../services/global-ui.service';
import { CheckboxModule } from 'primeng/checkbox';
import { injectUserData, isMasterUser } from '../../../utils/authUtils';
import { ProductFormData } from '../../../types/products.types';
import { YVUser } from '../../../types/user.types';
import { MAX_FILE_UPLOAD_SIZE } from '../../../constants/file-constants';

@Component({
	selector: 'add-product',
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
	],
	templateUrl: './add-product.component.html',
	styleUrl: './add-product.component.scss',
})
export class AddProductComponent {
	private _location = inject(Location);
	private _productsService = inject(ProductsService);
	private _globalUiService = inject(GlobalUiService);
	public user = injectUserData();

	public isMasterUser = computed(() => isMasterUser(this.user() as YVUser));

	public throwErrorToast = injectErrorToast();

	public applicationMethods = APPLICATION_METHODS;
	public containerTypes = CONTAINER_TYPES;
	public productCategories = PRODUCT_CATEGORIES;
	public quantityUnits = QUANTITY_UNITS;
	public coverageUnits = COVERAGE_UNITS;
	public maxFileUploadSize = MAX_FILE_UPLOAD_SIZE;

	public isMobile = this._globalUiService.isMobile;

	public form = new FormGroup({
		name: new FormControl('', [Validators.required]),
		brand: new FormControl('', [Validators.required]),
		description: new FormControl('', [Validators.required]),
		coverageAmount: new FormControl<number | null>(null, [Validators.required]),
		coverageUnit: new FormControl('sqft', [Validators.required]),
		applicationRate: new FormControl<number | null>(null, [
			Validators.required,
			applicationRateFieldValidator,
		]),
		applicationMethod: new FormControl('', [Validators.required]),
		guaranteedAnalysis: new FormControl('', [guaranteedAnalysisFieldValidator]),
		category: new FormControl('', [Validators.required]),
		quantityUnit: new FormControl('', [Validators.required]),
		containerType: new FormControl('', [Validators.required]),
		labelUrl: new FormControl('', [websiteUrlValidator]),
		image: new FormControl<File | null>(null),
		systemProduct: new FormControl(false),
	});

	public isLoading = signal(false);

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
		if (this.form.invalid) {
			Object.entries(this.form.controls).forEach(([_, ctrl]) =>
				ctrl.markAsDirty(),
			);

			return this.form.markAllAsTouched();
		}

		this.isLoading.set(true);
		this._productsService
			.addProduct({
				...this.form.value,
				coverage: this.form.value.coverageAmount,
			} as ProductFormData)
			.subscribe({
				next: () => {
					this._productsService.products.reload();
					this.isLoading.set(false);
					this._location.back();
				},
				error: () => {
					this.isLoading.set(false);
					this.throwErrorToast('Error adding product');
				},
			});
	}
}
