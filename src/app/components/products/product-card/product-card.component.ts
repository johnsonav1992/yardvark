import { Component, inject, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Product } from '../../../types/products.types';
import { TooltipModule } from 'primeng/tooltip';
import { NO_IMAGE_URL } from '../../../constants/style-constants';
import { Router } from '@angular/router';

@Component({
  selector: 'product-card',
  imports: [CardModule, ButtonModule, TooltipModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss'
})
export class ProductCardComponent {
  private _router = inject(Router);

  public product = input.required<Product>();

  public onHideProduct = output<Product['id']>();

  public noImageUrl = NO_IMAGE_URL;

  public viewProduct(): void {
    this._router.navigate(['products', this.product().id]);
  }

  public hideProduct(): void {
    this.onHideProduct.emit(this.product().id);
  }
}
