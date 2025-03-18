import { Component, ElementRef, inject, input, OnInit } from '@angular/core';
import { Product } from '../../../types/products.types';

@Component({
  selector: 'product-small-card',
  imports: [],
  templateUrl: './product-small-card.component.html',
  styleUrl: './product-small-card.component.scss'
})
export class ProductSmallCardComponent implements OnInit {
  private _el = inject(ElementRef);

  public product = input.required<Partial<Product>>();
  public fullWidth = input<boolean>(false);
  public showBorder = input<boolean>(true);
  public amountApplied = input<number | null>(null);

  public ngOnInit(): void {
    if (this.fullWidth()) {
      this._el.nativeElement.style.width = '100%';
    }
  }
}
