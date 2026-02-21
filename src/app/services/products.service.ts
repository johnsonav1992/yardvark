import { httpResource } from "@angular/common/http";
import { Injectable, linkedSignal } from "@angular/core";
import type { Observable } from "rxjs";
import type {
	GetProductsResponse,
	ProductFormData,
} from "../types/products.types";
import { apiUrl, postReq, putReq } from "../utils/httpUtils";

@Injectable({
	providedIn: "root",
})
export class ProductsService {
	public products = httpResource<GetProductsResponse>(() => apiUrl("products"));
	public optimisticProducts = linkedSignal(() => this.products.value());

	public addProduct(productFormData: ProductFormData): Observable<void> {
		const formData = new FormData();

		if (productFormData && typeof productFormData === "object") {
			Object.entries(productFormData).forEach(([key, value]) => {
				if (value instanceof File) {
					formData.append("product-image", value);
				} else {
					formData.append(key, String(value));
				}
			});
		}

		return postReq(apiUrl("products"), formData);
	}

	public hideProduct(productId: number): Observable<void> {
		return putReq(apiUrl("products/hide", { params: [productId] }), {});
	}

	public unHideProduct(productId: number): Observable<void> {
		return putReq(apiUrl("products/unhide", { params: [productId] }), {});
	}
}
