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
import {
  EntriesNotFound,
  EntryNotFound,
  InvalidDateRange,
} from '../models/entries.errors';
import { parseISO, isValid, startOfDay, endOfDay, getYear, startOfYear } from 'date-fns';

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
    Either<
      EntriesNotFound | InvalidDateRange,
      ReturnType<typeof getEntryResponseMapping>[]
    >
  > {
    if (startDate && endDate) {
      const parsedStart = parseISO(startDate);
      const parsedEnd = parseISO(endDate);

      if (!isValid(parsedStart) || !isValid(parsedEnd)) {
        return error(new InvalidDateRange());
      }
    }

    const entries = await this._entriesRepo.find({
      where: {
        userId,
        date:
          startDate && endDate
            ? Between(parseISO(startDate), parseISO(endDate))
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
    Either<
      EntryNotFound | InvalidDateRange,
      ReturnType<typeof getEntryResponseMapping>
    >
  > {
    const parsedDate = parseISO(date);

    if (!isValid(parsedDate)) {
      return error(new InvalidDateRange());
    }

    const entry = await this._entriesRepo.findOne({
      where: { userId, date: parsedDate },
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
    const todayEnd = endOfDay(new Date());

    const entry = await this._entriesRepo.findOne({
      where: {
        userId,
        date: Between(new Date(0), todayEnd),
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
  ): Promise<
    Either<InvalidDateRange, ReturnType<typeof getEntryResponseMapping>[]>
  > {
    const today = new Date();
    const yearStart = startOfYear(today);

    const startDate = searchCriteria.dateRange?.[0]
      ? parseISO(searchCriteria.dateRange[0])
      : yearStart;
    const endDate = searchCriteria.dateRange?.[1]
      ? parseISO(searchCriteria.dateRange[1])
      : today;

    if (!isValid(startDate) || !isValid(endDate)) {
      return error(new InvalidDateRange());
    }

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

    return success(entries.map((entry) => getEntryResponseMapping(entry)));
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
  }): Promise<Either<InvalidDateRange, Entry[]>> {
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
      const parsedStart = parseISO(startDate);
      const parsedEnd = parseISO(endDate);

      if (!isValid(parsedStart) || !isValid(parsedEnd)) {
        return error(new InvalidDateRange());
      }

      query = query.andWhere('entry.date BETWEEN :startDate AND :endDate', {
        startDate: parsedStart,
        endDate: parsedEnd,
      });
    }

    const entries = await query
      .orderBy('entry.embedding <-> :queryEmbedding')
      .setParameter('queryEmbedding', embeddingString)
      .limit(limit)
      .getMany();

    return success(entries);
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
