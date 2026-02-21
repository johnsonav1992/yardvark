import { Component, input, output } from "@angular/core";
import { NO_IMAGE_URL } from "../../../constants/style-constants";
import type { Product } from "../../../types/products.types";

export interface HiddenProductToggleEvent {
	id: number;
}

@Component({
	selector: "hidden-product-row",
	templateUrl: "./hidden-product-row.component.html",
	styleUrl: "./hidden-product-row.component.scss",
})
export class HiddenProductRowComponent {
	public noImageUrl = NO_IMAGE_URL;

	public product = input.required<Product>();

	public onToggleProductVisibility = output<HiddenProductToggleEvent>();

	public unhideProduct(): void {
		this.onToggleProductVisibility.emit({ id: this.product().id });
	}
}
