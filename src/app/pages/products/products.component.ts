import {
  Component,
  computed,
  inject,
  linkedSignal,
  signal
} from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { Tab } from '../../types/components.types';
import { Product, ProductCategories } from '../../types/products.types';
import { PageContainerComponent } from '../../components/layout/page-container/page-container.component';
import { ProductCardComponent } from '../../components/products/product-card/product-card.component';
import { EmptyMessageComponent } from '../../components/miscellanious/empty-message/empty-message.component';
import { ProductsService } from '../../services/products.service';
import { ButtonModule } from 'primeng/button';
import { ButtonDesignTokens } from '@primeng/themes/types/button';
import { TooltipModule } from 'primeng/tooltip';
import { Router } from '@angular/router';
import { GlobalUiService } from '../../services/global-ui.service';
import { LoadingSpinnerComponent } from '../../components/miscellanious/loading-spinner/loading-spinner.component';
import { FloatLabelModule } from 'primeng/floatlabel';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { DividerModule } from 'primeng/divider';
import { effectSignalLogger } from '../../utils/generalUtils';

@Component({
  selector: 'products',
  imports: [
    TabsModule,
    PageContainerComponent,
    ProductCardComponent,
    EmptyMessageComponent,
    ButtonModule,
    TooltipModule,
    LoadingSpinnerComponent,
    FloatLabelModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    FormsModule,
    DividerModule
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent {
  private _productsService = inject(ProductsService);
  private _router = inject(Router);
  private _globalUiService = inject(GlobalUiService);

  public isMobile = this._globalUiService.isMobile;

  public tabs: Tab<ProductCategories>[] = [
    { title: 'Fertilizer', value: 'fertilizer' },
    { title: 'Pre-emergent', value: 'pre-emergent' },
    { title: 'Post-emergent', value: 'post-emergent' },
    { title: 'Bio-stimulant', value: 'bio-stimulant' },
    { title: 'Plant-fertilizer', value: 'plant-fertilizer' },
    { title: 'Fungus-control', value: 'fungus-control' },
    { title: 'Insect-control', value: 'insect-control' },
    { title: 'Seed', value: 'seed' },
    { title: 'Other', value: 'other' }
  ];

  public products = this._productsService.products;

  public selectedTab = signal<Uncapitalize<ProductCategories>>('fertilizer');
  public searchQuery = signal('');

  public productsToShow = linkedSignal(() => {
    return this.products
      .value()
      ?.filter(
        (product) =>
          product.category === this.selectedTab() && !product.isHidden
      );
  });

  _ = effectSignalLogger(this.productsToShow);

  public filteredProducts = linkedSignal(() => {
    return this.products
      .value()
      ?.filter(
        (product) =>
          product.name
            .toLowerCase()
            .includes(this.searchQuery().toLowerCase()) ||
          product.description
            ?.toLowerCase()
            .includes(this.searchQuery().toLowerCase()) ||
          product.guaranteedAnalysis
            ?.toLowerCase()
            .includes(this.searchQuery().toLowerCase())
      );
  });

  public onTabChange(tab: string | number): void {
    const selectedTab = tab as Uncapitalize<ProductCategories>;

    this.selectedTab.set(selectedTab);
  }

  public hideProduct(productId: number): void {
    const currentProductsState = this.productsToShow();

    this._productsService.hideProduct(productId).subscribe({
      error: () => {
        this.productsToShow.set(currentProductsState);
      }
    });

    this.products.value?.update((products) => {
      if (!products) return [];

      return products
        .map((product) => ({
          ...product,
          isHidden: product.id === productId || product.isHidden
        }))
        .filter((product) => !product.isHidden);
    });
  }

  public navToAddProduct(): void {
    this._router.navigate(['products', 'add']);
  }

  public addButtonDt: ButtonDesignTokens = {
    root: {
      iconOnlyWidth: this.isMobile() ? '4rem' : '5rem',
      lg: {
        fontSize: '36px'
      }
    }
  };
}
