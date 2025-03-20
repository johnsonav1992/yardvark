import { Component, computed, inject, input } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MultiSelectChangeEvent, MultiSelectModule } from 'primeng/multiselect';
import { ProductsService } from '../../../services/products.service';
import { ProductSmallCardComponent } from '../product-small-card/product-small-card.component';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { QUANTITY_UNITS } from '../../../constants/product-constants';
import { Product } from '../../../types/products.types';
import { createEntryProductRow } from '../../../utils/entriesUtils';

@Component({
  selector: 'products-selector',
  imports: [
    MultiSelectModule,
    ProductSmallCardComponent,
    ReactiveFormsModule,
    InputNumberModule,
    SelectModule
  ],
  templateUrl: './products-selector.component.html',
  styleUrl: './products-selector.component.scss'
})
export class ProductsSelectorComponent {
  private _productsService = inject(ProductsService);

  public quantityUnits = QUANTITY_UNITS;

  public form = input.required<FormGroup>();
  public inputWidth = input<string | number>('100%');

  public productsControl = computed(
    () =>
      this.form().get('products') as FormArray<
        ReturnType<typeof createEntryProductRow>
      >
  );

  public products = this._productsService.products;

  public addProductToForm(e: MultiSelectChangeEvent): void {
    const product = e.itemValue as Product | undefined;
    const fullList = e.value as Product[];

    if (!product && fullList.length) {
      const existingProducts = this.productsControl().value;

      fullList.forEach((prod) => {
        const existingProductIndex = existingProducts.findIndex(
          (p) => p.product?.id === prod.id
        );

        if (existingProductIndex === -1) {
          this.productsControl().push(createEntryProductRow(prod));
        }
      });

      return;
    }

    const productIndex = this.productsControl().value.findIndex(
      (p) => p.product?.id === product?.id
    );

    if (productIndex !== -1) {
      this.productsControl().removeAt(productIndex);
    } else {
      this.productsControl().push(createEntryProductRow(product));
    }
  }
}
