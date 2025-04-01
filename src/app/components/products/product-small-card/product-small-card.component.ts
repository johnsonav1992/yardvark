import {
  Component,
  contentChild,
  effect,
  ElementRef,
  inject,
  input,
  TemplateRef
} from '@angular/core';
import { Product } from '../../../types/products.types';
import { NgTemplateOutlet } from '@angular/common';
import { CapitalizePipe } from '../../../pipes/capitalize.pipe';

@Component({
  selector: 'product-small-card',
  imports: [NgTemplateOutlet, CapitalizePipe],
  templateUrl: './product-small-card.component.html',
  styleUrl: './product-small-card.component.scss'
})
export class ProductSmallCardComponent {
  private _el = inject(ElementRef);

  public product = input.required<Partial<Product>>();
  public width = input<string | number>('100%');
  public showBorder = input<boolean>(true);
  public hideSubtitle = input<boolean>(false);
  public asAppliedAmount = input<boolean>(false);

  public actions = contentChild<TemplateRef<unknown>>('actions');

  public widthSetter = effect(() => {
    if (this.width()) {
      this._el.nativeElement.style.width = this.width();
    }
  });
}
