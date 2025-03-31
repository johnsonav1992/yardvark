import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Product } from '../models/products.model';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private _productsRepo: Repository<Product>,
  ) {}

  getProducts(
    userId: string,
    opts?: { userOnly?: boolean; systemOnly?: boolean },
  ) {
    const where = opts?.userOnly
      ? [{ userId }]
      : opts?.systemOnly
        ? [{ userId: 'system' }]
        : [{ userId }, { userId: 'system' }];

    return this._productsRepo.find({
      where,
    });
  }

  async addProduct(product: Product) {
    const newProduct = this._productsRepo.create(product);
    return await this._productsRepo.save(newProduct);
  }
}
