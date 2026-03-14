import {
	Component,
	computed,
	inject,
	linkedSignal,
	signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import type { ButtonDesignTokens } from "@primeuix/themes/types/button";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { DividerModule } from "primeng/divider";
import { DialogService } from "primeng/dynamicdialog";
import { FloatLabelModule } from "primeng/floatlabel";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { PageContainerComponent } from "../../components/layout/page-container/page-container.component";
import { EmptyMessageComponent } from "../../components/miscellanious/empty-message/empty-message.component";
import {
	ProductCardComponent,
	type ProductVisibilityToggleEvent,
} from "../../components/products/product-card/product-card.component";
import { ProductsVisibilityModalComponent } from "../../components/products/products-visibility-modal/products-visibility-modal.component";
import { NO_IMAGE_URL } from "../../constants/style-constants";
import { GlobalUiService } from "../../services/global-ui.service";
import { ProductsService } from "../../services/products.service";
import { SettingsService } from "../../services/settings.service";
import type { Tab } from "../../types/components.types";
import type {
	ProductCategories,
	ProductCategoryValues,
} from "../../types/products.types";

type TagSeverity =
	| "success"
	| "warn"
	| "danger"
	| "info"
	| "secondary"
	| "contrast";

const CATEGORY_SEVERITY_MAP: Record<string, TagSeverity> = {
	fertilizer: "success",
	"pre-emergent": "warn",
	"post-emergent": "warn",
	"bio-stimulant": "info",
	pgr: "info",
	"plant-fertilizer": "success",
	"fungus-control": "danger",
	"insect-control": "danger",
	seed: "contrast",
	other: "secondary",
};

@Component({
	selector: "products",
	imports: [
		TabsModule,
		PageContainerComponent,
		ProductCardComponent,
		EmptyMessageComponent,
		ButtonModule,
		TooltipModule,
		FloatLabelModule,
		IconFieldModule,
		InputIconModule,
		InputTextModule,
		FormsModule,
		DividerModule,
		SkeletonModule,
		CardModule,
		TableModule,
		TagModule,
	],
	templateUrl: "./products.component.html",
	styleUrl: "./products.component.scss",
	providers: [DialogService],
})
export class ProductsComponent {
	private _productsService = inject(ProductsService);
	private _router = inject(Router);
	private _globalUiService = inject(GlobalUiService);
	private _dialogService = inject(DialogService);
	private _settingsService = inject(SettingsService);

	public screenWidth = this._globalUiService.screenWidth;
	public isMobile = this._globalUiService.isMobile;
	public noImageUrl = NO_IMAGE_URL;

	public tabs: Tab<ProductCategories, ProductCategoryValues>[] = [
		{ title: "Fertilizer", value: "fertilizer" },
		{ title: "Pre-emergent", value: "pre-emergent" },
		{ title: "Post-emergent", value: "post-emergent" },
		{ title: "Bio-stimulant", value: "bio-stimulant" },
		{ title: "PGR", value: "pgr" },
		{ title: "Plant-fertilizer", value: "plant-fertilizer" },
		{ title: "Fungus-control", value: "fungus-control" },
		{ title: "Insect-control", value: "insect-control" },
		{ title: "Seed", value: "seed" },
		{ title: "Other", value: "other" },
	];

	public products = this._productsService.products;
	public optimisticProducts = this._productsService.optimisticProducts;
	public viewMode = this._productsService.viewMode;

	public selectedTab = signal<ProductCategoryValues>("fertilizer");
	public searchQuery = signal("");

	public productsToShow = linkedSignal(() => {
		const shouldHideSystemProducts =
			this._settingsService.currentSettings()?.hideSystemProducts;

		return this.optimisticProducts()
			?.filter(
				(product) =>
					product.category === this.selectedTab() &&
					!product.isHidden &&
					!(shouldHideSystemProducts && product.userId === "system"),
			)
			.toSorted((a, b) => a.name.localeCompare(b.name));
	});

	public filteredProducts = linkedSignal(() => {
		return this.optimisticProducts()?.filter(
			(product) =>
				product.name.toLowerCase().includes(this.searchQuery().toLowerCase()) ||
				product.description
					?.toLowerCase()
					.includes(this.searchQuery().toLowerCase()) ||
				product.guaranteedAnalysis
					?.toLowerCase()
					.includes(this.searchQuery().toLowerCase()),
		);
	});

	public onTabChange(tab: string | number | undefined): void {
		if (tab === undefined) return;

		const selectedTab = tab as ProductCategoryValues;

		this.selectedTab.set(selectedTab);
	}

	public toggleViewMode(): void {
		this.viewMode.set(this.viewMode() === "grid" ? "table" : "grid");
	}

	public goToProduct(id: number): void {
		this._router.navigate(["products", id]);
	}

	public getCategoryTagSeverity(category: string): TagSeverity {
		return CATEGORY_SEVERITY_MAP[category] ?? "secondary";
	}

	public toggleProductVisibility(e: ProductVisibilityToggleEvent): void {
		const currentProductsState = this.productsToShow();

		this._productsService.hideProduct(e.id).subscribe({
			error: () => {
				this.products.set(currentProductsState);
				this.optimisticProducts.set(currentProductsState);
			},
		});

		this.products.update((products) => {
			if (!products) return [];

			return products.map((product) => ({
				...product,
				isHidden: product.id === e.id || product.isHidden,
			}));
		});

		this.optimisticProducts.update((products) => {
			if (!products) return [];

			return products
				.map((product) => ({
					...product,
					isHidden: product.id === e.id || product.isHidden,
				}))
				.filter((product) => !product.isHidden);
		});
	}

	public navToAddProduct(): void {
		this._router.navigate(["products", "add"]);
	}

	public openProductsVisibilityModal(): void {
		const dialogRef = this._dialogService.open(
			ProductsVisibilityModalComponent,
			{
				header: `Hidden Products`,
				modal: true,
				focusOnShow: false,
				width: "50%",
				dismissableMask: true,
				closable: true,
				contentStyle: { overflow: "visible" },
				breakpoints: {
					"800px": "95%",
				},
				maximizable: true,
			},
		);

		if (dialogRef && this.isMobile()) {
			const instance = this._dialogService.getInstance(dialogRef);

			if (instance) instance.maximize();
		}
	}

	public addButtonDt = computed<ButtonDesignTokens>(() => ({
		root: {
			iconOnlyWidth: this.isMobile() ? "4rem" : "5rem",
			lg: {
				fontSize: "36px",
				iconOnlyWidth: this.isMobile() ? "4rem" : "5rem",
			},
		},
	}));
}
