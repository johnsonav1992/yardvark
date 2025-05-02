import { Component, computed, inject } from '@angular/core';
import { PageContainerComponent } from '../../../components/layout/page-container/page-container.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { ProductsService } from '../../../services/products.service';
import { TitleCasePipe } from '@angular/common';
import { DividerModule } from 'primeng/divider';
import { DividerDesignTokens } from '@primeng/themes/types/divider';
import { GlobalUiService } from '../../../services/global-ui.service';
import { LoadingSpinnerComponent } from '../../../components/miscellanious/loading-spinner/loading-spinner.component';

@Component({
  selector: 'product-view',
  imports: [
    PageContainerComponent,
    TitleCasePipe,
    DividerModule,
    LoadingSpinnerComponent,
    TitleCasePipe
  ],
  templateUrl: './product-view.component.html',
  styleUrl: './product-view.component.scss'
})
export class ProductViewComponent {
  private _route = inject(ActivatedRoute);
  private _productsService = inject(ProductsService);
  private _globalUiService = inject(GlobalUiService);

  public isMobile = this._globalUiService.isMobile;

  public productId = toSignal(
    this._route.params.pipe(map((params) => parseInt(params['productId'])))
  );

  public isLoading = computed(() => this._productsService.products.isLoading());

  public product = computed(() =>
    this._productsService.products
      .value()
      ?.find((product) => product.id === this.productId())
  );

  public dividerDt: DividerDesignTokens = {
    horizontal: {
      margin: '0'
    }
  };
}
