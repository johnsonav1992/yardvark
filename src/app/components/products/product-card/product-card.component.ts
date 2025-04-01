import { Component, input } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Product } from '../../../types/products.types';
import { TooltipModule } from 'primeng/tooltip';
import { NO_IMAGE_URL } from '../../../constants/style-constants';

@Component({
  selector: 'product-card',
  imports: [CardModule, ButtonModule, TooltipModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss'
})
export class ProductCardComponent {
  public product = input.required<Product>();

  public noImageUrl = NO_IMAGE_URL;
}
