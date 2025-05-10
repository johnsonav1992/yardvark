import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Product } from '../models/products.model';
import { InjectRepository } from '@nestjs/typeorm';
import { UserHiddenProduct } from '../models/userHiddenProducts';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private _productsRepo: Repository<Product>,
    @InjectRepository(UserHiddenProduct)
    private _userHiddenProductsRepo: Repository<UserHiddenProduct>,
  ) {}

  async getProducts(
    userId: string,
    opts?: { userOnly?: boolean; systemOnly?: boolean },
  ) {
    const where = opts?.userOnly
      ? [{ userId }]
      : opts?.systemOnly
        ? [{ userId: 'system' }]
        : [{ userId }, { userId: 'system' }];

    const products = await this._productsRepo.find({
      where,
    });

    const hiddenProductIds = await this._userHiddenProductsRepo.find({
      where: { userId },
    });

    return products.map((product) => {
      const isHidden = hiddenProductIds.some(
        (hiddenProduct) => hiddenProduct.productId === product.id,
      );

      return {
        ...product,
        isHidden,
      };
    });
  }

  async addProduct(product: Product) {
    const newProduct = this._productsRepo.create(product);
    return await this._productsRepo.save(newProduct);
  }

  async hideProduct(userId: string, productId: number) {
    await this._userHiddenProductsRepo.save({ userId, productId });
  }

  async unhideProduct(userId: string, productId: number) {
    await this._userHiddenProductsRepo.delete({ userId, productId });
  }
}
