import { Component, computed, inject, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Product, ProductWithVisibility } from '../../../types/products.types';
import { NO_IMAGE_URL } from '../../../constants/style-constants';
import { Router } from '@angular/router';
import { GlobalUiService } from '../../../services/global-ui.service';
import { injectUserData, isMasterUser } from '../../../utils/authUtils';
import { YVUser } from '../../../types/user.types';

@Component({
	selector: 'product-card',
	imports: [CardModule, ButtonModule],
	templateUrl: './product-card.component.html',
	styleUrl: './product-card.component.scss',
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
		this._router.navigate(['products', this.product().id]);
	}

	public toggleProductVisibility(): void {
		this.onToggleProductVisibility.emit({
			id: this.product().id,
			visible: !this.product().isHidden,
		});
	}
}

export type ProductVisibilityToggleEvent = {
	id: Product['id'];
	visible: boolean;
};
