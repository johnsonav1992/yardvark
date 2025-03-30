import { Component } from '@angular/core';
import { PageContainerComponent } from '../../../components/layout/page-container/page-container.component';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import {
  FileSelectEvent,
  FileUploadHandlerEvent,
  FileUploadModule
} from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { guaranteedAnalysisFieldValidator } from '../../../utils/formUtils';

@Component({
  selector: 'add-product',
  imports: [
    PageContainerComponent,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    FileUploadModule,
    ButtonModule,
    DropdownModule,
    ReactiveFormsModule
  ],
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.scss'
})
export class AddProductComponent {
  public form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    brand: new FormControl('', [Validators.required]),
    description: new FormControl('', [Validators.required]),
    coverageAmount: new FormControl<number | null>(null, [Validators.required]),
    coverageUnit: new FormControl('', [Validators.required]),
    applicationRate: new FormControl<number | null>(null, [
      Validators.required
    ]),
    applicationMethod: new FormControl('', [Validators.required]),
    guaranteedAnalysis: new FormControl('', [guaranteedAnalysisFieldValidator]),
    category: new FormControl('', [Validators.required]),
    quantityUnit: new FormControl('', [Validators.required]),
    containerType: new FormControl('', [Validators.required]),
    image: new FormControl<File | null>(null)
  });

  public fileUpload(e: FileSelectEvent): void {
    const file = e.files[0];
    this.form.patchValue({ image: file });
  }

  public fileClear(): void {
    this.form.patchValue({ image: null });
  }

  public submit(): void {
    console.log(this.form.value);
  }
}
