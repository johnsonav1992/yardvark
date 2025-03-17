import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { apiUrl } from '../utils/httpUtils';
import { injectUserData } from '../utils/authUtils';
import { Product } from '../types/products.types';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  public user = injectUserData();

  public products = httpResource<Product[]>(() =>
    this.user()?.sub
      ? apiUrl('products', { params: [this.user()?.sub!] })
      : undefined
  );
}
