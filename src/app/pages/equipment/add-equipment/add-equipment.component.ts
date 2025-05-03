import { Component, inject, signal } from '@angular/core';
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
import { Equipment, EquipmentFormData } from '../../../types/equipment.types';

@Component({
  selector: 'add-equipment',
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
  templateUrl: './add-equipment.component.html',
  styleUrl: './add-equipment.component.scss'
})
export class AddEquipmentComponent {
  private _location = inject(Location);
  private _equipmentService = inject(EquipmentService);
  private _globalUiService = inject(GlobalUiService);
  public user = injectUserData();

  public throwErrorToast = injectErrorToast();

  public isMobile = this._globalUiService.isMobile;

  public form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    brand: new FormControl('', [Validators.required]),
    model: new FormControl('', [Validators.required]),
    description: new FormControl('', [Validators.required]),
    serialNumber: new FormControl(''),
    purchaseDate: new FormControl<Date | null>(null),
    purchasePrice: new FormControl<number | null>(null, [
      Validators.min(0),
      Validators.max(99999999)
    ]),
    fuelType: new FormControl(''),
    image: new FormControl<File | null>(null)
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
      return showAllFormErrorsOnSubmit(this.form);
    }

    this.isLoading.set(true);

    const newEquipment: EquipmentFormData = {
      name: this.form.value.name!,
      brand: this.form.value.brand!,
      model: this.form.value.model!,
      description: this.form.value.description!,
      serialNumber: this.form.value.serialNumber!,
      purchaseDate: this.form.value.purchaseDate!,
      purchasePrice: this.form.value.purchasePrice!,
      fuelType: this.form.value.fuelType!,
      image: this.form.value.image!
    };

    this._equipmentService.createEquipment(newEquipment).subscribe({
      next: () => {
        this.isLoading.set(false);
        this._equipmentService.equipment.reload();
        this.back();
      },
      error: () => {
        this.isLoading.set(false);
        this.throwErrorToast('Error creating equipment. Please try again.');
      }
    });
  }
}
