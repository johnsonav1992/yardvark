import { Component, computed, inject, input } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MultiSelectChangeEvent, MultiSelectModule } from 'primeng/multiselect';
import { ProductsService } from '../../../services/products.service';
import { ProductSmallCardComponent } from '../product-small-card/product-small-card.component';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { QUANTITY_UNITS } from '../../../constants/product-constants';
import { Product } from '../../../types/products.types';
import {
  createEntryProductRow,
  EntryProductRow
} from '../../../utils/entriesUtils';
import { GlobalUiService } from '../../../services/global-ui.service';

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
  private _globalUiService = inject(GlobalUiService);

  public quantityUnits = QUANTITY_UNITS;
  public isMobile = this._globalUiService.isMobile;

  public form = input.required<FormGroup>();
  public inputWidth = input<string | number>('100%');
  public productCardsWidth = input<string | number>('100%');
  public products = this._productsService.products;

  public productsControl = computed(
    () => this.form().get('products') as FormArray<EntryProductRow>
  );

  public updateSelectedProducts(e: MultiSelectChangeEvent): void {
    const product = e.itemValue as Product | undefined;
    const fullList = e.value as Product[];

    if (fullList.length === 0) return this.productsControl().clear();

    if (!product && fullList.length) return this._handleBulkSelection(fullList);

    this._toggleSingleProduct(product);
  }

  public onPanelShow() {
    setTimeout(() => {
      const input = document.querySelector('.p-multiselect-filter');

      if (input instanceof HTMLInputElement) input.blur();
    });
  }

  private _handleBulkSelection(productList: Product[]): void {
    const existingProducts = this.productsControl().value;

    productList.forEach((prod) => {
      const existingProductIndex = existingProducts.findIndex(
        (p) => p.product?.id === prod.id
      );

      if (existingProductIndex === -1) {
        this.productsControl().push(createEntryProductRow(prod));
      }
    });
  }

  private _toggleSingleProduct(product?: Product): void {
    if (!product) return;

    const productIndex = this.productsControl().value.findIndex(
      (p) => p.product?.id === product.id
    );

    if (productIndex !== -1) {
      this.productsControl().removeAt(productIndex);
    } else {
      this.productsControl().push(createEntryProductRow(product));
    }
  }
}
