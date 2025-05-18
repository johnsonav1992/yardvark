import { Component, computed, inject } from '@angular/core';
import { ProductsService } from '../../../services/products.service';
import {
  ProductCardComponent,
  ProductVisibilityToggleEvent
} from '../product-card/product-card.component';
import { EmptyMessageComponent } from '../../miscellanious/empty-message/empty-message.component';
import { GlobalUiService } from '../../../services/global-ui.service';

@Component({
  selector: 'products-visibility-modal',
  imports: [ProductCardComponent, EmptyMessageComponent],
  templateUrl: './products-visibility-modal.component.html',
  styleUrl: './products-visibility-modal.component.scss'
})
export class ProductsVisibilityModalComponent {
  private _productsService = inject(ProductsService);
  private _globalUiService = inject(GlobalUiService);

  public products = this._productsService.products;
  public optimisticProducts = this._productsService.optimisticProducts;
  public isMobile = this._globalUiService.isMobile;

  public hiddenProducts = computed(() =>
    this.products.value()?.filter((product) => product.isHidden)
  );

  public toggleProductVisibility(e: ProductVisibilityToggleEvent): void {
    this._productsService.unHideProduct(e.id).subscribe();

    this.products.update((products) => {
      if (!products) return [];

      return products.map((product) => ({
        ...product,
        isHidden: product.id === e.id ? false : product.isHidden
      }));
    });

    this.optimisticProducts.update((products) => {
      if (!products) return [];

      return products
        .map((product) => ({
          ...product,
          isHidden: product.id === e.id ? false : product.isHidden
        }))
        .filter((product) => !product.isHidden);
    });
  }
}
