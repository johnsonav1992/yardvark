import { Injectable } from "@nestjs/common";
import { format } from "date-fns";
import { ACTIVITY_IDS } from "../../../constants/activities.constants";
import type { AiEntryDraftData, AiEntryDraftProduct } from "../../../types/ai.types";
import { type Either, error, success } from "../../../types/either";
import { EntriesService } from "../../entries/services/entries.service";
import type { getEntryResponseMapping } from "../../entries/utils/entryUtils";
import { LawnSegmentsService } from "../../lawn-segments/services/lawn-segments.service";
import { ProductsService } from "../../products/services/products.service";
import { AiChatError } from "../models/ai.errors";
import {
	ENTRY_QUERY_FULL_DETAIL_THRESHOLD,
	type EntryQueryToolName,
	getEntryQueryToolDefinitions,
} from "../utils/entry-query-tools.config";
import {
	type EntrySearchParams,
	type ProposeEntryParams,
	mapEntrySearchParamsToEntriesSearch,
	mergeUniqueNumberIds,
	sanitizeEntry,
	sanitizeEntryLean,
} from "../utils/entry-query-tools.utils";

const ACTIVITY_NAMES: Record<number, string> = {
	[ACTIVITY_IDS.MOW]: "Mow",
	[ACTIVITY_IDS.EDGE]: "Edge",
	[ACTIVITY_IDS.TRIM]: "Trim",
	[ACTIVITY_IDS.DETHATCH]: "Dethatch",
	[ACTIVITY_IDS.BLOW]: "Blow",
	[ACTIVITY_IDS.AERATE]: "Aerate",
	[ACTIVITY_IDS.WATER]: "Water",
	[ACTIVITY_IDS.LAWN_LEVELING]: "Lawn Leveling",
	[ACTIVITY_IDS.PRODUCT_APPLICATION]: "Product Application",
};

type MappedEntry = ReturnType<typeof getEntryResponseMapping>;

@Injectable()
export class EntryQueryToolsService {
	constructor(
		private readonly entriesService: EntriesService,
		private readonly productsService: ProductsService,
		private readonly lawnSegmentsService: LawnSegmentsService,
	) {}

	private async resolveProductIdsForSearch(
		userId: string,
		params: EntrySearchParams,
	): Promise<number[]> {
		const selectedProductIds = params.products ?? [];
		const selectedCategories = params.productCategories ?? [];

		if (selectedCategories.length === 0) {
			return selectedProductIds;
		}

		const categoryProducts = await Promise.all(
			selectedCategories.map((category) => this.listProducts(userId, category)),
		);

		const categoryProductIds = categoryProducts
			.flat()
			.map((product) => product.id);

		return mergeUniqueNumberIds(selectedProductIds, categoryProductIds);
	}

	public async searchEntries(userId: string, params: EntrySearchParams) {
		const productIds = await this.resolveProductIdsForSearch(userId, params);
		const result = await this.entriesService.searchEntries(
			userId,
			mapEntrySearchParamsToEntriesSearch(params, productIds),
		);

		if (result.isError()) {
			throw new Error("Failed to search entries");
		}

		const entries = result.value as MappedEntry[];
		const totalCount = entries.length;

		if (totalCount > ENTRY_QUERY_FULL_DETAIL_THRESHOLD) {
			return {
				totalCount,
				note: "Large result set — returning lean format. Call get_entry_by_id for full details on a specific entry.",
				entries: entries.map(sanitizeEntryLean),
			};
		}

		return {
			totalCount,
			entries: entries.map(sanitizeEntry),
		};
	}

	public async getLastActivityDate(
		userId: string,
		activityType: "mow" | "product_application" | "pgr",
	) {
		let date: Date | null = null;

		switch (activityType) {
			case "mow":
				date = await this.entriesService.getLastMowDate(userId);
				break;
			case "product_application":
				date = await this.entriesService.getLastProductApplicationDate(userId);
				break;
			case "pgr":
				date = await this.entriesService.getLastPgrApplicationDate(userId);
				break;
		}

		return date ? { date: format(date, "yyyy-MM-dd") } : { date: null };
	}

	public async listProducts(userId: string, category?: string) {
		const products = await this.productsService.getProducts(userId);
		const filteredProducts = category
			? products.filter((product) => product.category === category)
			: products;

		return filteredProducts.map((product) => ({
			id: product.id,
			name: product.name,
			brand: product.brand,
			category: product.category,
		}));
	}

	public async listLawnSegments(userId: string) {
		const segments = await this.lawnSegmentsService.getLawnSegments(userId);

		return segments.map((segment) => ({
			id: segment.id,
			name: segment.name,
			size: segment.size,
		}));
	}

	public async getEntryById(userId: string, entryId: number) {
		const result = await this.entriesService.getEntry(entryId);

		if (result.isError()) {
			throw new Error("Failed to get entry");
		}

		const entry = result.value as MappedEntry;

		if (entry.userId !== userId) {
			throw new Error("Unauthorized access to entry");
		}

		return sanitizeEntry(entry);
	}

	public async proposeEntry(
		userId: string,
		params: ProposeEntryParams,
	): Promise<AiEntryDraftData> {
		const lawnSegmentIds = params.lawnSegmentIds ?? [];
		const proposedProducts = params.products ?? [];

		let lawnSegmentNames: string[] = [];

		if (lawnSegmentIds.length > 0) {
			const allSegments = await this.listLawnSegments(userId);
			const segmentMap = new Map(allSegments.map((s) => [s.id, s.name]));

			for (const id of lawnSegmentIds) {
				if (!segmentMap.has(id)) {
					throw new Error(
						`Lawn segment ${id} not found or does not belong to this user`,
					);
				}
			}

			lawnSegmentNames = lawnSegmentIds.map((id) => segmentMap.get(id)!);
		}

		let resolvedProducts: AiEntryDraftProduct[] = [];

		if (proposedProducts.length > 0) {
			const allProducts = await this.listProducts(userId);
			const productMap = new Map(allProducts.map((p) => [p.id, p.name]));

			resolvedProducts = proposedProducts.map((p) => {
				const name = productMap.get(p.productId);

				if (!name) {
					throw new Error(
						`Product ${p.productId} not found or does not belong to this user`,
					);
				}

				return {
					productId: p.productId,
					productName: name,
					productQuantity: p.productQuantity,
					productQuantityUnit: p.productQuantityUnit,
				};
			});
		}

		const activityNames = params.activityIds.map(
			(id) => ACTIVITY_NAMES[id] ?? `Activity ${id}`,
		);

		return {
			date: params.date,
			time: params.time,
			title: params.title,
			notes: params.notes ?? "",
			activityIds: params.activityIds,
			activityNames,
			lawnSegmentIds,
			lawnSegmentNames,
			products: resolvedProducts,
			mowingHeight: params.mowingHeight,
			mowingHeightUnit: params.mowingHeightUnit,
			soilTemperature: params.soilTemperature,
			soilTemperatureUnit: params.soilTemperatureUnit,
		};
	}

	public getToolDefinitions() {
		return getEntryQueryToolDefinitions();
	}

	public async executeTool(
		userId: string,
		toolName: EntryQueryToolName,
		args: Record<string, unknown>,
	): Promise<Either<AiChatError, unknown>> {
		try {
			switch (toolName) {
				case "search_entries":
					return success(
						await this.searchEntries(userId, args as EntrySearchParams),
					);
				case "get_last_activity_date":
					return success(
						await this.getLastActivityDate(
							userId,
							args.activityType as "mow" | "product_application" | "pgr",
						),
					);
				case "list_products":
					return success(
						await this.listProducts(
							userId,
							args.category as string | undefined,
						),
					);
				case "list_lawn_segments":
					return success(await this.listLawnSegments(userId));
				case "get_entry_by_id":
					return success(
						await this.getEntryById(userId, args.entryId as number),
					);
				case "propose_entry":
					return success(
						await this.proposeEntry(userId, args as unknown as ProposeEntryParams),
					);
				default:
					return error(new AiChatError(new Error(`Unknown tool: ${toolName}`)));
			}
		} catch (err) {
			return error(new AiChatError(err));
		}
	}
}
