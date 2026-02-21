import { NgTemplateOutlet } from "@angular/common";
import {
	Component,
	contentChild,
	ElementRef,
	effect,
	inject,
	input,
	type TemplateRef,
} from "@angular/core";
import { NO_IMAGE_URL } from "../../../constants/style-constants";
import { CapitalizePipe } from "../../../pipes/capitalize.pipe";
import type { Product } from "../../../types/products.types";

@Component({
	selector: "product-small-card",
	imports: [NgTemplateOutlet, CapitalizePipe],
	templateUrl: "./product-small-card.component.html",
	styleUrl: "./product-small-card.component.scss",
})
export class ProductSmallCardComponent {
	private _el = inject(ElementRef);

	public noImageUrl = NO_IMAGE_URL;

	public product = input.required<Partial<Product>>();
	public width = input<string | number>("100%");
	public showBorder = input<boolean>(true);
	public hideSubtitle = input<boolean>(false);
	public asAppliedAmount = input<boolean>(false);

	public actions = contentChild<TemplateRef<unknown>>("actions");

	public widthSetter = effect(() => {
		if (this.width()) {
			this._el.nativeElement.style.width = this.width();
		}
	});
}
