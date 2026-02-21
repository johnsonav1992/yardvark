import { Component, computed, inject, input, output } from "@angular/core";
import { Router } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { NO_IMAGE_URL } from "../../../constants/style-constants";
import { GlobalUiService } from "../../../services/global-ui.service";
import type {
	Product,
	ProductWithVisibility,
} from "../../../types/products.types";
import type { YVUser } from "../../../types/user.types";
import { injectUserData, isMasterUser } from "../../../utils/authUtils";

@Component({
	selector: "product-card",
	imports: [CardModule, ButtonModule],
	templateUrl: "./product-card.component.html",
	styleUrl: "./product-card.component.scss",
})
export class ProductCardComponent {
	private _router = inject(Router);
	private _globalUiService = inject(GlobalUiService);
	public user = injectUserData();

	public screenWidth = this._globalUiService.screenWidth;

	public product = input.required<ProductWithVisibility>();

	public onToggleProductVisibility = output<ProductVisibilityToggleEvent>();

	public noImageUrl = NO_IMAGE_URL;
	public isMobile = this._globalUiService.isMobile;
	public isMasterUser = computed(() => isMasterUser(this.user() as YVUser));

	public viewProduct(): void {
		this._router.navigate(["products", this.product().id]);
	}

	public toggleProductVisibility(): void {
		this.onToggleProductVisibility.emit({
			id: this.product().id,
			visible: !this.product().isHidden,
		});
	}
}

export type ProductVisibilityToggleEvent = {
	id: Product["id"];
	visible: boolean;
};
