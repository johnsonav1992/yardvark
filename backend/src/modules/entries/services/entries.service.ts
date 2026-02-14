import { Injectable } from '@nestjs/common';
import {
  BatchEntryCreationRequest,
  BatchEntryCreationResponse,
  EntriesSearchRequest,
  EntryCreationRequest,
} from '../models/entries.types';
import {
  Between,
  In,
  Repository,
  ILike,
  FindOptionsWhere,
  Brackets,
} from 'typeorm';
import { Entry, EntryImage, EntryProduct } from '../models/entries.model';
import { InjectRepository } from '@nestjs/typeorm';
import { getEntryResponseMapping } from '../utils/entryUtils';
import { ACTIVITY_IDS } from 'src/constants/activities.constants';
import { LogHelpers } from '../../../logger/logger.helpers';
import { Either, error, success } from '../../../types/either';
import { EntriesNotFound, EntryNotFound } from '../models/entries.errors';

@Injectable()
export class EntriesService {
  constructor(
    @InjectRepository(Entry)
    private readonly _entriesRepo: Repository<Entry>,
    @InjectRepository(EntryProduct)
    private readonly _entryProductsRepo: Repository<EntryProduct>,
    @InjectRepository(EntryImage)
    private readonly _entryImagesRepo: Repository<EntryImage>,
  ) {}

  public async getEntries(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<
    Either<EntriesNotFound, ReturnType<typeof getEntryResponseMapping>[]>
  > {
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
        entryImages: true,
      },
    });

    if (!entries) {
      return error(new EntriesNotFound());
    }

    LogHelpers.addBusinessContext('entriesReturned', entries.length);

    return success(entries.map((entry) => getEntryResponseMapping(entry)));
  }

  public async getEntry(
    entryId: number,
  ): Promise<
    Either<EntryNotFound, ReturnType<typeof getEntryResponseMapping>>
  > {
    LogHelpers.addBusinessContext('entryId', entryId);

    const entry = await this._entriesRepo.findOne({
      where: { id: entryId },
      relations: {
        activities: true,
        lawnSegments: true,
        entryProducts: {
          product: true,
        },
        entryImages: true,
      },
    });

    if (!entry) {
      return error(new EntryNotFound());
    }

    return success(getEntryResponseMapping(entry));
  }

  public async getEntryByDate(
    userId: string,
    date: string,
  ): Promise<
    Either<EntryNotFound, ReturnType<typeof getEntryResponseMapping>>
  > {
    const entry = await this._entriesRepo.findOne({
      where: { userId, date: new Date(date) },
      relations: {
        activities: true,
        lawnSegments: true,
        entryProducts: {
          product: true,
        },
        entryImages: true,
      },
    });

    if (!entry) {
      return error(new EntryNotFound());
    }

    return success(getEntryResponseMapping(entry));
  }

  public async getMostRecentEntry(userId: string) {
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
        entryImages: true,
      },
    });

    if (!entry) return null;

    return getEntryResponseMapping(entry);
  }

  public async getLastMowDate(userId: string) {
    const entry = await this._entriesRepo.findOne({
      where: {
        userId,
        date: Between(new Date(0), new Date()),
        activities: { id: ACTIVITY_IDS.MOW },
      },
      order: {
        date: 'DESC',
        time: 'DESC',
      },
    });

    return entry?.date || null;
  }

  public async getLastProductApplicationDate(userId: string) {
    const entry = await this._entriesRepo
      .createQueryBuilder('entry')
      .leftJoin('entry.activities', 'activity')
      .leftJoin('entry.entryProducts', 'product')
      .where('entry.userId = :userId', { userId })
      .andWhere('entry.date <= :today', { today: new Date() })
      .andWhere(
        new Brackets((qb) => {
          qb.where('activity.id = :activityId', {
            activityId: ACTIVITY_IDS.PRODUCT_APPLICATION,
          }).orWhere('product.product_id IS NOT NULL');
        }),
      )
      .orderBy('entry.date', 'DESC')
      .addOrderBy('entry.time', 'DESC')
      .getOne();

    return entry?.date || null;
  }

  /**
   * Gets the date of the most recent entry with a PGR (Plant Growth Regulator) product
   * Used for GDD (Growing Degree Days) calculation
   */
  public async getLastPgrApplicationDate(userId: string): Promise<Date | null> {
    const entry = await this._entriesRepo
      .createQueryBuilder('entry')
      .innerJoin('entry.entryProducts', 'entryProduct')
      .innerJoin('entryProduct.product', 'product')
      .where('entry.userId = :userId', { userId })
      .andWhere('entry.date <= :today', { today: new Date() })
      .andWhere('product.category = :category', { category: 'pgr' })
      .orderBy('entry.date', 'DESC')
      .addOrderBy('entry.time', 'DESC')
      .getOne();

    return entry?.date || null;
  }

  public async createEntry(userId: string, entry: EntryCreationRequest) {
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
      entryImages:
        entry.imageUrls?.map((url) => ({
          imageUrl: url,
        })) || [],
    });

    await this._entriesRepo.save(newEntry);

    LogHelpers.addBusinessContext('entryCreated', newEntry.id);
    LogHelpers.addBusinessContext(
      'activitiesCount',
      entry.activityIds?.length ?? 0,
    );
    LogHelpers.addBusinessContext('productsCount', entry.products?.length ?? 0);

    return newEntry;
  }

  public async createEntriesBatch(
    userId: string,
    body: BatchEntryCreationRequest,
  ): Promise<BatchEntryCreationResponse> {
    const results = await Promise.allSettled(
      body.entries.map((entry) => this.createEntry(userId, entry)),
    );

    const entries: Entry[] = [];
    const errors: { index: number; error: string }[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        entries.push(result.value);
      } else {
        const reason = result.reason as Error | undefined;
        errors.push({
          index,
          error: reason?.message || 'Unknown error',
        });
      }
    });

    LogHelpers.addBusinessContext('batchSize', body.entries.length);
    LogHelpers.addBusinessContext('batchCreated', entries.length);
    LogHelpers.addBusinessContext('batchFailed', errors.length);

    return {
      created: entries.length,
      failed: errors.length,
      entries,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  public async updateEntry(
    entryId: number,
    entry: Partial<EntryCreationRequest>,
  ): Promise<Either<EntryNotFound, Entry>> {
    LogHelpers.addBusinessContext('entryId', entryId);

    const entryToUpdate = await this._entriesRepo.findOne({
      where: { id: entryId },
      relations: {
        lawnSegments: true,
        activities: true,
        entryProducts: true,
        entryImages: true,
      },
    });

    if (!entryToUpdate) {
      return error(new EntryNotFound());
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
      entryImages: [
        ...entryToUpdate.entryImages,
        ...(entry.imageUrls?.map((url) => ({
          imageUrl: url,
        })) || []),
      ],
    });

    await this._entriesRepo.save(updatedEntry);

    return success(updatedEntry);
  }

  public async softDeleteEntry(
    entryId: number,
  ): Promise<Either<EntryNotFound, void>> {
    LogHelpers.addBusinessContext('entryId', entryId);

    const entry = await this._entriesRepo.findOne({
      where: { id: entryId },
    });

    if (!entry) {
      return error(new EntryNotFound());
    }

    await this._entriesRepo.softDelete(entryId);
    LogHelpers.addBusinessContext('entryDeleted', true);

    return success(undefined);
  }

  public async recoverEntry(entryId: number) {
    await this._entriesRepo.restore(entryId);
  }

  public async searchEntries(
    userId: string,
    searchCriteria: EntriesSearchRequest,
  ) {
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
      order: {
        date: 'DESC',
        time: 'DESC',
      },
    });

    LogHelpers.addBusinessContext('searchResultsCount', entries.length);

    return entries.map((entry) => getEntryResponseMapping(entry));
  }

  public async softDeleteEntryImage(entryImageId: number) {
    await this._entryImagesRepo.softDelete(entryImageId);
  }

  public async recoverEntryImage(entryImageId: number) {
    await this._entryImagesRepo.restore(entryImageId);
  }

  public async searchEntriesByVector({
    userId,
    queryEmbedding,
    limit = 200,
    startDate,
    endDate,
  }: {
    userId: string;
    queryEmbedding: number[];
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<Entry[]> {
    const embeddingString = `[${queryEmbedding.join(',')}]`;

    let query = this._entriesRepo
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.activities', 'activities')
      .leftJoinAndSelect('entry.lawnSegments', 'lawnSegments')
      .leftJoinAndSelect('entry.entryProducts', 'entryProducts')
      .leftJoinAndSelect('entryProducts.product', 'product')
      .leftJoinAndSelect('entry.entryImages', 'entryImages')
      .where('entry.userId = :userId', { userId })
      .andWhere('entry.embedding IS NOT NULL');

    if (startDate && endDate) {
      query = query.andWhere('entry.date BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    return query
      .orderBy('entry.embedding <-> :queryEmbedding')
      .setParameter('queryEmbedding', embeddingString)
      .limit(limit)
      .getMany();
  }

  public async updateEntryEmbedding(entryId: number, embedding: number[]) {
    const embeddingString = `[${embedding.join(',')}]`;
    await this._entriesRepo.update(entryId, { embedding: embeddingString });
  }

  public async getEntriesWithoutEmbeddings(userId: string): Promise<Entry[]> {
    return this._entriesRepo
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.activities', 'activities')
      .leftJoinAndSelect('entry.lawnSegments', 'lawnSegments')
      .leftJoinAndSelect('entry.entryProducts', 'entryProducts')
      .leftJoinAndSelect('entryProducts.product', 'product')
      .where('entry.userId = :userId', { userId })
      .andWhere('entry.embedding IS NULL')
      .getMany();
  }
}
