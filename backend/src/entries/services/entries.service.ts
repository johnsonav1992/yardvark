import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  EntriesSearchRequest,
  EntryCreationRequest,
} from '../models/entries.types';
import { Between, In, Repository, ILike, FindOptionsWhere } from 'typeorm';
import { Entry, EntryProduct } from '../models/entries.model';
import { InjectRepository } from '@nestjs/typeorm';
import { getEntryProductMapping } from '../utils/entryUtils';

@Injectable()
export class EntriesService {
  constructor(
    @InjectRepository(Entry)
    private _entriesRepo: Repository<Entry>,
    @InjectRepository(EntryProduct)
    private _entryProductsRepo: Repository<EntryProduct>,
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
        products: getEntryProductMapping(entryProducts),
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
      products: getEntryProductMapping(entry?.entryProducts || []),
    };
  }

  async getEntryByDate(userId: string, date: string) {
    const entry = await this._entriesRepo.findOne({
      where: { userId, date: new Date(date) },
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
      products: getEntryProductMapping(entry?.entryProducts || []),
    };
  }

  async getMostRecentEntry(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const entry = await this._entriesRepo.findOne({
      where: {
        userId,
        date: Between(new Date(0), endOfToday),
      },
      order: {
        date: 'DESC',
        time: 'DESC',
      },
      relations: {
        activities: true,
        lawnSegments: true,
        entryProducts: { product: true },
      },
    });

    if (!entry) return null;

    const { entryProducts, ...rest } = entry;

    return {
      ...rest,
      products: getEntryProductMapping(entryProducts),
    };
  }

  async createEntry(userId: string, entry: EntryCreationRequest) {
    const newEntry = this._entriesRepo.create({
      ...entry,
      userId,
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

  async updateEntry(entryId: number, entry: Partial<EntryCreationRequest>) {
    const entryToUpdate = await this._entriesRepo.findOne({
      where: { id: entryId },
      relations: {
        lawnSegments: true,
        activities: true,
        entryProducts: true,
      },
    });

    if (!entryToUpdate) {
      throw new HttpException('Entry not found', HttpStatus.NOT_FOUND);
    }

    entryToUpdate.lawnSegments = [];
    entryToUpdate.activities = [];

    if (entryToUpdate.entryProducts?.length) {
      await this._entryProductsRepo.remove(entryToUpdate.entryProducts);

      entryToUpdate.entryProducts = [];
    }

    const updatedEntry = this._entriesRepo.merge(entryToUpdate, {
      ...entry,
      activities: entry.activityIds?.map((id) => ({ id })) || [],
      lawnSegments: entry.lawnSegmentIds?.map((id) => ({ id })) || [],
      entryProducts:
        entry.products?.map((product) => ({
          product: { id: product.productId },
          productQuantity: product.productQuantity,
          productQuantityUnit: product.productQuantityUnit,
        })) || [],
    });

    await this._entriesRepo.save(updatedEntry);

    return updatedEntry;
  }

  async softDeleteEntry(entryId: number) {
    await this._entriesRepo.softDelete(entryId);
  }

  async recoverEntry(entryId: number) {
    await this._entriesRepo.restore(entryId);
  }

  async searchEntries(userId: string, searchCriteria: EntriesSearchRequest) {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const startDate = searchCriteria.dateRange?.[0]
      ? new Date(searchCriteria.dateRange[0])
      : startOfYear;
    const endDate = searchCriteria.dateRange?.[1]
      ? new Date(searchCriteria.dateRange[1])
      : today;

    const baseConditions: FindOptionsWhere<Entry> = {
      userId,
      date: Between(startDate, endDate),
    };

    if (searchCriteria.activities?.length > 0) {
      baseConditions.activities = { id: In(searchCriteria.activities) };
    }

    if (searchCriteria.lawnSegments?.length > 0) {
      baseConditions.lawnSegments = { id: In(searchCriteria.lawnSegments) };
    }

    if (searchCriteria.products?.length > 0) {
      baseConditions.entryProducts = {
        product: { id: In(searchCriteria.products) },
      };
    }

    let where: FindOptionsWhere<Entry> | FindOptionsWhere<Entry>[] =
      baseConditions;

    if (searchCriteria.titleOrNotes) {
      const searchVal = ILike(`%${searchCriteria.titleOrNotes}%`);

      where = [
        { ...baseConditions, title: searchVal },
        { ...baseConditions, notes: searchVal },
      ];
    }

    const entries = await this._entriesRepo.find({
      where,
      relations: {
        activities: true,
        lawnSegments: true,
        entryProducts: { product: true },
      },
    });

    return entries.map((entry) => {
      const { entryProducts, ...rest } = entry;

      return {
        ...rest,
        products: getEntryProductMapping(entryProducts),
      };
    });
  }
}
