import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Product } from '../models/products.model';
import { InjectRepository } from '@nestjs/typeorm';
import { UserHiddenProduct } from '../models/userHiddenProducts.model';
import { LogHelpers } from '../../../logger/logger.helpers';

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

    const products = await LogHelpers.withDatabaseTelemetry(() =>
      this._productsRepo.find({
        where,
      }),
    );

    const hiddenProductIds = await LogHelpers.withDatabaseTelemetry(() =>
      this._userHiddenProductsRepo.find({
        where: { userId },
      }),
    );

    LogHelpers.addBusinessContext('productsReturned', products.length);
    LogHelpers.addBusinessContext(
      'hiddenProductsCount',
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
    const saved = await LogHelpers.withDatabaseTelemetry(() =>
      this._productsRepo.save(newProduct),
    );

    LogHelpers.addBusinessContext('productCreated', saved.id);

    return saved;
  }

  public async hideProduct(userId: string, productId: number) {
    LogHelpers.addBusinessContext('productId', productId);

    await LogHelpers.withDatabaseTelemetry(() =>
      this._userHiddenProductsRepo.save({ userId, productId }),
    );

    LogHelpers.addBusinessContext('productHidden', true);
  }

  public async unhideProduct(userId: string, productId: number) {
    LogHelpers.addBusinessContext('productId', productId);

    await LogHelpers.withDatabaseTelemetry(() =>
      this._userHiddenProductsRepo.delete({ userId, productId }),
    );

    LogHelpers.addBusinessContext('productUnhidden', true);
  }
}
