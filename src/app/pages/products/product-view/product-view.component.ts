import { TitleCasePipe } from "@angular/common";
import { Component, computed, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute } from "@angular/router";
import type { DividerDesignTokens } from "@primeuix/themes/types/divider";
import { ButtonModule } from "primeng/button";
import { DividerModule } from "primeng/divider";
import { SkeletonModule } from "primeng/skeleton";
import { map } from "rxjs";
import { PageContainerComponent } from "../../../components/layout/page-container/page-container.component";
import { NO_IMAGE_URL } from "../../../constants/style-constants";
import { GlobalUiService } from "../../../services/global-ui.service";
import { ProductsService } from "../../../services/products.service";

@Component({
	selector: "product-view",
	imports: [
		PageContainerComponent,
		TitleCasePipe,
		DividerModule,
		TitleCasePipe,
		ButtonModule,
		SkeletonModule,
	],
	templateUrl: "./product-view.component.html",
	styleUrl: "./product-view.component.scss",
})
export class ProductViewComponent {
	private _route = inject(ActivatedRoute);
	private _productsService = inject(ProductsService);
	private _globalUiService = inject(GlobalUiService);

	public noImageUrl = NO_IMAGE_URL;

	public isMobile = this._globalUiService.isMobile;

	public productId = toSignal(
		this._route.params.pipe(map((params) => parseInt(params["productId"], 10))),
	);

	public isLoading = computed(() => this._productsService.products.isLoading());

	public product = computed(() =>
		this._productsService.products
			.value()
			?.find((product) => product.id === this.productId()),
	);

	public viewLabel(): void {
		window.open(this.product()?.labelUrl, "_blank");
	}

	public dividerDt: DividerDesignTokens = {
		horizontal: {
			margin: "0",
		},
	};
}
