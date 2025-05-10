import { Component, computed, inject } from '@angular/core';
import { ProductsService } from '../../../services/products.service';
import { ProductCardComponent } from '../product-card/product-card.component';

@Component({
  selector: 'products-visibility-modal',
  imports: [ProductCardComponent],
  templateUrl: './products-visibility-modal.component.html',
  styleUrl: './products-visibility-modal.component.scss'
})
export class ProductsVisibilityModalComponent {
  private _productsService = inject(ProductsService);

  public products = this._productsService.products.value;

  public hiddenProducts = computed(() =>
    this.products()?.filter((product) => product.isHidden)
  );
}
