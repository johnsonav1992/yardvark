import { Component, computed, inject } from '@angular/core';
import { PageContainerComponent } from '../../../components/layout/page-container/page-container.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { ProductsService } from '../../../services/products.service';

@Component({
  selector: 'product-view',
  imports: [PageContainerComponent],
  templateUrl: './product-view.component.html',
  styleUrl: './product-view.component.scss'
})
export class ProductViewComponent {
  private _route = inject(ActivatedRoute);
  private _productsService = inject(ProductsService);

  public productId = toSignal(
    this._route.params.pipe(map((params) => parseInt(params['productId'])))
  );

  public product = computed(() =>
    this._productsService.products
      .value()
      ?.find((product) => product.id === this.productId())
  );

  public pageTitle = computed(
    () => `${this.product()?.brand} - ${this.product()?.name}`
  );
}
