import { Component } from '@angular/core';
import { PageContainerComponent } from '../../../components/layout/page-container/page-container.component';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'add-product',
  imports: [
    PageContainerComponent,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    FileUploadModule,
    ButtonModule
  ],
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.scss'
})
export class AddProductComponent {}
