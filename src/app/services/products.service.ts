import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { apiUrl, postReq } from '../utils/httpUtils';
import { Product, ProductFormData } from '../types/products.types';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  public products = httpResource<Product[]>(() => apiUrl('products'));

  public addProduct(productFormData: ProductFormData): Observable<void> {
    const formData = new FormData();

    if (productFormData && typeof productFormData === 'object') {
      Object.entries(productFormData).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append('product-image', value);
        } else {
          formData.append(key, String(value));

          if (productFormData.systemProduct) {
            formData.append('systemProduct', 'true');
          }
        }
      });
    }

    return postReq(apiUrl('products'), formData);
  }
}
