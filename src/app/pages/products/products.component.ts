import { Component, computed, inject, signal } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { Tab } from '../../types/components.types';
import { ProductCategories } from '../../types/products.types';
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

@Component({
  selector: 'products',
  imports: [
    TabsModule,
    PageContainerComponent,
    ProductCardComponent,
    EmptyMessageComponent,
    ButtonModule,
    TooltipModule,
    LoadingSpinnerComponent
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

  public productsToShow = computed(() => {
    return this.products
      .value()
      ?.filter((product) => product.category === this.selectedTab());
  });

  public onTabChange(tab: string | number): void {
    const selectedTab = tab as Uncapitalize<ProductCategories>;

    this.selectedTab.set(selectedTab);
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
