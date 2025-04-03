import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { apiUrl, postReq } from '../utils/httpUtils';
import { Product } from '../types/products.types';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  public products = httpResource<Product[]>(() => apiUrl('products'));

  public addProduct(product: unknown): Observable<void> {
    const formData = new FormData();

    if (product && typeof product === 'object') {
      Object.entries(product).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append('product-image', value);
        } else {
          formData.append(key, String(value));

          if ('systemProduct' in product && product.systemProduct) {
            formData.append('systemProduct', 'true');
          }
        }
      });
    }

    return postReq(apiUrl('products'), formData);
  }
}
