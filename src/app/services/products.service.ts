import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { apiUrl } from '../utils/httpUtils';
import { Product } from '../types/products.types';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  public products = httpResource<Product[]>(() => apiUrl('products'));
}
