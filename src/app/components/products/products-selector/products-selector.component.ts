import { Component, computed, inject, input, signal } from "@angular/core";
import {
	type FormArray,
	type FormGroup,
	ReactiveFormsModule,
} from "@angular/forms";
import { InputNumberModule } from "primeng/inputnumber";
import { MessageModule } from "primeng/message";
import {
	type MultiSelectChangeEvent,
	MultiSelectModule,
} from "primeng/multiselect";
import { SelectModule } from "primeng/select";
import { QUANTITY_UNITS } from "../../../constants/product-constants";
import { GlobalUiService } from "../../../services/global-ui.service";
import { ProductsService } from "../../../services/products.service";
import type { EntryProduct } from "../../../types/entries.types";
import type { LawnSegment } from "../../../types/lawnSegments.types";
import type { Product } from "../../../types/products.types";
import {
	createEntryProductRow,
	type EntryProductRow,
} from "../../../utils/entriesUtils";
import { calculateNitrogenForProducts } from "../../../utils/lawnCalculatorUtils";
import { ProductSmallCardComponent } from "../product-small-card/product-small-card.component";

@Component({
	selector: "products-selector",
	imports: [
		MultiSelectModule,
		ProductSmallCardComponent,
		ReactiveFormsModule,
		InputNumberModule,
		SelectModule,
		MessageModule,
	],
	templateUrl: "./products-selector.component.html",
	styleUrl: "./products-selector.component.scss",
})
export class ProductsSelectorComponent {
	private _productsService = inject(ProductsService);
	private _globalUiService = inject(GlobalUiService);

	public quantityUnits = QUANTITY_UNITS;
	public isMobile = this._globalUiService.isMobile;

	public form = input.required<FormGroup>();
	public inputWidth = input<string | number>("100%");
	public productCardsWidth = input<string | number>("100%");
	public selectedLawnSegments = input<LawnSegment[]>([]);
	public products = this._productsService.products;

	public productsSorted = computed(() =>
		this.products
			.value()
			?.toSorted((a, b) =>
				a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
			),
	);

	public productsControl = computed(
		() => this.form().get("products") as FormArray<EntryProductRow>,
	);

	public productsFormValues = signal<ProductFormValue[]>([]);

	public selectedProductNitrogen = computed(() => {
		const selectedProducts = this.productsFormValues();
		const selectedLawnSegments = this.selectedLawnSegments();

		if (!selectedProducts?.length || !selectedLawnSegments?.length) return null;

		const validProducts = selectedProducts.filter(
			(p): p is ValidatedProductFormValue =>
				!!(
					p.product &&
					p.quantity !== null &&
					p.quantityUnit &&
					"category" in p.product
				),
		);

		if (!validProducts.length) return null;

		return calculateNitrogenForProducts(validProducts, selectedLawnSegments);
	});

	public updateSelectedProducts(e: MultiSelectChangeEvent): void {
		const product = e.itemValue as Product | undefined;
		const fullList = e.value as Product[];

		if (fullList.length === 0) return this.productsControl().clear();

		if (!product && fullList.length) return this._handleBulkSelection(fullList);

		this._toggleSingleProduct(product);
	}

	private _handleBulkSelection(productList: Product[]): void {
		const existingProducts = this.productsControl().value;

		productList.forEach((prod) => {
			const existingProductIndex = existingProducts.findIndex(
				(p) => p.product?.id === prod.id,
			);

			if (existingProductIndex === -1) {
				this.productsControl().push(createEntryProductRow(prod));
			}
		});
	}

	private _toggleSingleProduct(product?: Product): void {
		if (!product) return;

		const productIndex = this.productsControl().value.findIndex(
			(p) => p.product?.id === product.id,
		);

		if (productIndex !== -1) {
			this.productsControl().removeAt(productIndex);
		} else {
			this.productsControl().push(createEntryProductRow(product));
		}
	}
}

type ProductFormValue = Partial<{
	product: Product | EntryProduct | null;
	quantity: number | null;
	quantityUnit: string | null;
}>;

type ValidatedProductFormValue = {
	product: Product;
	quantity: number;
	quantityUnit: string;
};
