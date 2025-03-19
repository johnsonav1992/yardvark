import {
  Component,
  contentChild,
  ElementRef,
  inject,
  input,
  OnInit,
  TemplateRef
} from '@angular/core';
import { Product } from '../../../types/products.types';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'product-small-card',
  imports: [NgTemplateOutlet],
  templateUrl: './product-small-card.component.html',
  styleUrl: './product-small-card.component.scss'
})
export class ProductSmallCardComponent implements OnInit {
  private _el = inject(ElementRef);

  public product = input.required<Partial<Product>>();
  public fullWidth = input<boolean>(false);
  public showBorder = input<boolean>(true);
  public asAppliedAmount = input<boolean>(false);

  public actions = contentChild<TemplateRef<unknown>>('actions');

  public ngOnInit(): void {
    if (this.fullWidth()) {
      this._el.nativeElement.style.width = '100%';
    }
  }
}
