import { Component, computed, signal } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { Tab } from '../../types/components.types';
import { Product, ProductCategories } from '../../types/products.types';
import { PageContainerComponent } from '../../components/layout/page-container/page-container.component';
import { ProductCardComponent } from '../../components/products/product-card/product-card.component';
import { httpResource } from '@angular/common/http';
import { apiUrl } from '../../utils/httpUtils';
import { injectUserData } from '../../utils/authUtils';
import { EmptyMessageComponent } from '../../components/miscellanious/empty-message/empty-message.component';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ProgressSpinnerDesignTokens } from '@primeng/themes/types/progressspinner';

@Component({
  selector: 'products',
  imports: [
    TabsModule,
    PageContainerComponent,
    ProductCardComponent,
    EmptyMessageComponent,
    ProgressSpinnerModule
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent {
  public user = injectUserData();

  public tabs: Tab<ProductCategories>[] = [
    { title: 'Fertilizer', value: 'fertilizer' },
    { title: 'Pre-emergent', value: 'pre-emergent' },
    { title: 'Post-emergent', value: 'post-emergent' },
    { title: 'Plant-fertilizer', value: 'plant-fertilizer' },
    { title: 'Fungus-control', value: 'fungus-control' },
    { title: 'Insect-control', value: 'insect-control' },
    { title: 'Seed', value: 'seed' },
    { title: 'Other', value: 'other' }
  ];

  public products = httpResource<Product[]>(() =>
    this.user()
      ? apiUrl('products', { params: [this.user()?.sub!] })
      : undefined
  );

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

  public spinnerDt: ProgressSpinnerDesignTokens = {
    root: {
      'color.1': '{primary.500}',
      'color.2': '{primary.500}',
      'color.3': '{primary.500}',
      'color.4': '{primary.500}'
    }
  };
}
