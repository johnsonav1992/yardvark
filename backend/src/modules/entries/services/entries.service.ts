import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { endOfDay, isValid, parse, startOfDay, startOfYear } from "date-fns";
import { UTCDate } from "@date-fns/utc";
import { ACTIVITY_IDS } from "src/constants/activities.constants";
import {
	Between,
	Brackets,
	type FindOptionsWhere,
	ILike,
	In,
	type Repository,
} from "typeorm";
import { LogHelpers } from "../../../logger/logger.helpers";
import { BusinessContextKeys } from "../../../logger/logger-keys.constants";
import { type Either, error, success } from "../../../types/either";
import {
	EntriesNotFound,
	EntryNotFound,
	InvalidDateRange,
} from "../models/entries.errors";
import { Entry, EntryImage, EntryProduct } from "../models/entries.model";
import type {
	BatchEntryCreationRequest,
	BatchEntryCreationResponse,
	EntriesSearchRequest,
	EntryCreationRequest,
} from "../models/entries.types";
import { getEntryResponseMapping } from "../utils/entryUtils";

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
		options?: { raw?: boolean },
	): Promise<
		Either<
			EntriesNotFound | InvalidDateRange,
			ReturnType<typeof getEntryResponseMapping>[] | Entry[]
		>
	> {
		if (startDate && endDate) {
			const parsedStart = this.parseDate(startDate);
			const parsedEnd = this.parseDate(endDate);

			if (!isValid(parsedStart) || !isValid(parsedEnd)) {
				return error(new InvalidDateRange());
			}
		}

		const entries = await this._entriesRepo.find({
			where: {
				userId,
				date:
					startDate && endDate
						? Between(this.parseDate(startDate), this.parseDate(endDate))
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

		LogHelpers.addBusinessContext(
			BusinessContextKeys.entriesReturned,
			entries.length,
		);

		if (options?.raw) {
			return success(entries);
		}

		return success(entries.map((entry) => getEntryResponseMapping(entry)));
	}

	public async getEntry(
		entryId: number,
		options?: { raw?: boolean },
	): Promise<
		Either<EntryNotFound, ReturnType<typeof getEntryResponseMapping> | Entry>
	> {
		LogHelpers.addBusinessContext(BusinessContextKeys.entryId, entryId);

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

		if (options?.raw) {
			return success(entry);
		}

		return success(getEntryResponseMapping(entry));
	}

	public async getEntryByDate(
		userId: string,
		date: string,
		options?: { raw?: boolean },
	): Promise<
		Either<
			EntryNotFound | InvalidDateRange,
			ReturnType<typeof getEntryResponseMapping> | Entry
		>
	> {
		const parsedDate = this.parseDate(date);

		if (!isValid(parsedDate)) {
			return error(new InvalidDateRange());
		}

		const dateString = parsedDate.toISOString().split("T")[0];
		const utcDate = new UTCDate(dateString);
		const start = startOfDay(utcDate);
		const end = endOfDay(utcDate);

		const entry = await this._entriesRepo.findOne({
			where: {
				userId,
				date: Between(start, end),
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

		if (!entry) {
			return error(new EntryNotFound());
		}

		if (options?.raw) {
			return success(entry);
		}

		return success(getEntryResponseMapping(entry));
	}

	public async getMostRecentEntry(userId: string, options?: { raw?: boolean }) {
		const todayEnd = endOfDay(new Date());

		const entry = await this._entriesRepo.findOne({
			where: {
				userId,
				date: Between(new Date(0), todayEnd),
			},
			order: {
				date: "DESC",
				time: "DESC",
			},
			relations: {
				activities: true,
				lawnSegments: true,
				entryProducts: { product: true },
				entryImages: true,
			},
		});

		if (!entry) return null;

		if (options?.raw) {
			return entry;
		}

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
				date: "DESC",
				time: "DESC",
			},
		});

		return entry?.date || null;
	}

	public async getLastProductApplicationDate(userId: string) {
		const entry = await this._entriesRepo
			.createQueryBuilder("entry")
			.leftJoin("entry.activities", "activity")
			.leftJoin("entry.entryProducts", "product")
			.where("entry.userId = :userId", { userId })
			.andWhere("entry.date <= :today", { today: new Date() })
			.andWhere(
				new Brackets((qb) => {
					qb.where("activity.id = :activityId", {
						activityId: ACTIVITY_IDS.PRODUCT_APPLICATION,
					}).orWhere("product.product_id IS NOT NULL");
				}),
			)
			.orderBy("entry.date", "DESC")
			.addOrderBy("entry.time", "DESC")
			.getOne();

		return entry?.date || null;
	}

	/**
	 * Gets the date of the most recent entry with a PGR (Plant Growth Regulator) product
	 * Used for GDD (Growing Degree Days) calculation
	 */
	public async getLastPgrApplicationDate(userId: string): Promise<Date | null> {
		const entry = await this._entriesRepo
			.createQueryBuilder("entry")
			.innerJoin("entry.entryProducts", "entryProduct")
			.innerJoin("entryProduct.product", "product")
			.where("entry.userId = :userId", { userId })
			.andWhere("entry.date <= :today", { today: new Date() })
			.andWhere("product.category = :category", { category: "pgr" })
			.orderBy("entry.date", "DESC")
			.addOrderBy("entry.time", "DESC")
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

		LogHelpers.addBusinessContext(
			BusinessContextKeys.entryCreated,
			newEntry.id,
		);
		LogHelpers.addBusinessContext(
			"activitiesCount",
			entry.activityIds?.length ?? 0,
		);
		LogHelpers.addBusinessContext(
			BusinessContextKeys.productsCount,
			entry.products?.length ?? 0,
		);

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
			if (result.status === "fulfilled") {
				entries.push(result.value);
			} else {
				const reason = result.reason as Error | undefined;
				errors.push({
					index,
					error: reason?.message || "Unknown error",
				});
			}
		});

		LogHelpers.addBusinessContext(
			BusinessContextKeys.batchSize,
			body.entries.length,
		);
		LogHelpers.addBusinessContext(
			BusinessContextKeys.batchCreated,
			entries.length,
		);
		LogHelpers.addBusinessContext(
			BusinessContextKeys.batchFailed,
			errors.length,
		);

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
		LogHelpers.addBusinessContext(BusinessContextKeys.entryId, entryId);

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
		LogHelpers.addBusinessContext(BusinessContextKeys.entryId, entryId);

		const entry = await this._entriesRepo.findOne({
			where: { id: entryId },
		});

		if (!entry) {
			return error(new EntryNotFound());
		}

		await this._entriesRepo.softDelete(entryId);
		LogHelpers.addBusinessContext(BusinessContextKeys.entryDeleted, true);

		return success(undefined);
	}

	public async recoverEntry(entryId: number) {
		await this._entriesRepo.restore(entryId);
	}

	public async searchEntries(
		userId: string,
		searchCriteria: EntriesSearchRequest,
		options?: { raw?: boolean },
	): Promise<
		Either<
			InvalidDateRange,
			ReturnType<typeof getEntryResponseMapping>[] | Entry[]
		>
	> {
		const today = new Date();
		const yearStart = startOfYear(today);

		const startDate = searchCriteria.dateRange?.[0]
			? this.parseDate(searchCriteria.dateRange[0])
			: yearStart;
		const endDate = searchCriteria.dateRange?.[1]
			? this.parseDate(searchCriteria.dateRange[1])
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
				entryImages: true,
			},
			order: {
				date: "DESC",
				time: "DESC",
			},
		});

		LogHelpers.addBusinessContext(
			BusinessContextKeys.searchResultsCount,
			entries.length,
		);

		if (options?.raw) {
			return success(entries);
		}

		return success(entries.map((entry) => getEntryResponseMapping(entry)));
	}

	public async softDeleteEntryImage(entryImageId: number) {
		await this._entryImagesRepo.softDelete(entryImageId);
	}

	public async recoverEntryImage(entryImageId: number) {
		await this._entryImagesRepo.restore(entryImageId);
	}

	private parseDate(dateString: string): Date {
		const dateOnly = dateString.includes("T")
			? dateString.split("T")[0]
			: dateString;

		return parse(dateOnly, "yyyy-MM-dd", new Date());
	}
}
