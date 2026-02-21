import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Product } from '../models/products.model';
import { InjectRepository } from '@nestjs/typeorm';
import { UserHiddenProduct } from '../models/userHiddenProducts.model';
import { LogHelpers } from '../../../logger/logger.helpers';
import { BusinessContextKeys } from '../../../logger/logger-keys.constants';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly _productsRepo: Repository<Product>,
    @InjectRepository(UserHiddenProduct)
    private readonly _userHiddenProductsRepo: Repository<UserHiddenProduct>,
  ) {}

  public async getProducts(
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

    LogHelpers.addBusinessContext(
      BusinessContextKeys.productsReturned,
      products.length,
    );
    LogHelpers.addBusinessContext(
      BusinessContextKeys.productsCount,
      hiddenProductIds.length,
    );

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

  public async addProduct(product: Product) {
    const newProduct = this._productsRepo.create(product);
    const saved = await this._productsRepo.save(newProduct);

    LogHelpers.addBusinessContext(BusinessContextKeys.productCreated, saved.id);

    return saved;
  }

  public async hideProduct(userId: string, productId: number) {
    LogHelpers.addBusinessContext(BusinessContextKeys.productId, productId);

    await this._userHiddenProductsRepo.save({ userId, productId });

    LogHelpers.addBusinessContext(BusinessContextKeys.productHidden, true);
  }

  public async unhideProduct(userId: string, productId: number) {
    LogHelpers.addBusinessContext(BusinessContextKeys.productId, productId);

    await this._userHiddenProductsRepo.delete({ userId, productId });

    LogHelpers.addBusinessContext(BusinessContextKeys.productUnhidden, true);
  }
}
