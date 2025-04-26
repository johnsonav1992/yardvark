import { Component, computed, inject, input } from '@angular/core';
import { PageContainerComponent } from '../../../components/layout/page-container/page-container.component';
import { Product } from '../../../types/products.types';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { ProductsService } from '../../../services/products.service';
import { effectSignalLogger } from '../../../utils/generalUtils';

@Component({
  selector: 'product-view',
  imports: [PageContainerComponent],
  templateUrl: './product-view.component.html',
  styleUrl: './product-view.component.scss'
})
export class ProductViewComponent {
  private _route = inject(ActivatedRoute);
  private _productsService = inject(ProductsService);

  public productId = toSignal<number>(
    this._route.params.pipe(map((params) => params['productId']))
  );

  public product = computed(
    () =>
      this._productsService.products
        .value()
        ?.find((product) => product.id === this.productId())!
  );

  _ = effectSignalLogger(this.product);
}
