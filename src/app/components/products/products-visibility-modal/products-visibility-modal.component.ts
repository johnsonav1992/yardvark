import { Component, computed, inject } from '@angular/core';
import { ProductsService } from '../../../services/products.service';
import {
  ProductCardComponent,
  ProductVisibilityToggleEvent
} from '../product-card/product-card.component';
import { tap } from 'rxjs';
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
  public isMobile = this._globalUiService.isMobile;

  public hiddenProducts = computed(() =>
    this.products.value()?.filter((product) => product.isHidden)
  );

  public toggleProductVisibility(e: ProductVisibilityToggleEvent): void {
    this._productsService
      .unHideProduct(e.id)
      .pipe(tap(() => this.products.reload()))
      .subscribe();
  }
}
