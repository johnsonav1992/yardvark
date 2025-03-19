import { Injectable } from '@nestjs/common';
import { EntryCreationRequest } from '../models/entries.types';
import { Between, Repository } from 'typeorm';
import { Entry } from '../models/entries.model';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class EntriesService {
  constructor(
    @InjectRepository(Entry)
    private _entriesRepo: Repository<Entry>,
  ) {}

  async getEntries(userId: string, startDate?: string, endDate?: string) {
    const entries = await this._entriesRepo.find({
      where: {
        userId,
        date:
          startDate && endDate
            ? Between(new Date(startDate), new Date(endDate))
            : undefined,
      },
      relations: {
        activities: true,
        lawnSegments: true,
        entryProducts: {
          product: true,
        },
      },
    });

    return entries.map((entry) => {
      const { entryProducts, ...rest } = entry;

      return {
        ...rest,
        products: entryProducts.map((entryProduct) => ({
          productId: entryProduct.product.id,
          name: entryProduct.product.name,
          brand: entryProduct.product.brand,
          imageUrl: entryProduct.product.imageUrl,
          quantity: entryProduct.productQuantity,
          quantityUnit: entryProduct.productQuantityUnit,
          guaranteedAnalysis: entryProduct.product.guaranteedAnalysis,
          containerType: entryProduct.product.containerType,
        })),
      };
    });
  }

  async getEntry(entryId: number) {
    const entry = await this._entriesRepo.findOne({
      where: { id: entryId },
      relations: {
        activities: true,
        lawnSegments: true,
        entryProducts: {
          product: true,
        },
      },
    });

    return {
      ...entry,
      products: entry?.entryProducts.map((entryProduct) => ({
        productId: entryProduct.product.id,
        name: entryProduct.product.name,
        brand: entryProduct.product.brand,
        imageUrl: entryProduct.product.imageUrl,
        quantity: entryProduct.productQuantity,
        quantityUnit: entryProduct.productQuantityUnit,
        guaranteedAnalysis: entryProduct.product.guaranteedAnalysis,
        containerType: entryProduct.product.containerType,
      })),
    };
  }

  async createEntry(entry: EntryCreationRequest) {
    const newEntry = this._entriesRepo.create({
      ...entry,
      activities: entry.activityIds?.map((id) => ({ id })),
      lawnSegments: entry.lawnSegmentIds?.map((id) => ({ id })),
      entryProducts: entry.products.map((product) => ({
        product: { id: product.productId },
        productQuantity: product.productQuantity,
        productQuantityUnit: product.productQuantityUnit,
      })),
    });

    await this._entriesRepo.save(newEntry);

    return newEntry;
  }

  async softDeleteEntry(entryId: number) {
    await this._entriesRepo.softDelete(entryId);
  }

  async recoverEntry(entryId: number) {
    await this._entriesRepo.restore(entryId);
  }
}
