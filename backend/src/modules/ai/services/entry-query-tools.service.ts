import { Injectable } from "@nestjs/common";
import { format } from "date-fns";
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
	mapEntrySearchParamsToEntriesSearch,
	mergeUniqueNumberIds,
	sanitizeEntry,
	sanitizeEntryLean,
} from "../utils/entry-query-tools.utils";

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
				default:
					return error(new AiChatError(new Error(`Unknown tool: ${toolName}`)));
			}
		} catch (err) {
			return error(new AiChatError(err));
		}
	}
}
