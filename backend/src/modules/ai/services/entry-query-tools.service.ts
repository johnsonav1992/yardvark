import { Injectable } from "@nestjs/common";
import { format } from "date-fns";
import { ACTIVITY_IDS } from "../../../constants/activities.constants";
import { EntriesService } from "../../entries/services/entries.service";
import type { getEntryResponseMapping } from "../../entries/utils/entryUtils";
import { LawnSegmentsService } from "../../lawn-segments/services/lawn-segments.service";
import { ProductsService } from "../../products/services/products.service";

const FULL_DETAIL_THRESHOLD = 50;

type MappedEntry = ReturnType<typeof getEntryResponseMapping>;

@Injectable()
export class EntryQueryToolsService {
	constructor(
		private readonly entriesService: EntriesService,
		private readonly productsService: ProductsService,
		private readonly lawnSegmentsService: LawnSegmentsService,
	) {}

	private sanitizeEntry(entry: MappedEntry) {
		return {
			id: entry.id,
			date: format(entry.date, "yyyy-MM-dd"),
			time: entry.time,
			title: entry.title,
			notes: entry.notes,
			soilTemperature: entry.soilTemperature,
			soilTemperatureUnit: entry.soilTemperatureUnit,
			mowingHeight: entry.mowingHeight,
			mowingHeightUnit: entry.mowingHeightUnit,
			activities: entry.activities.map((a) => ({ id: a.id, name: a.name })),
			lawnSegments: entry.lawnSegments.map((s) => ({
				id: s.id,
				name: s.name,
				size: s.size,
			})),
			products: entry.products.map((p) => ({
				id: p.id,
				name: p.name,
				brand: p.brand,
				category: p.category,
				quantity: p.quantity,
				quantityUnit: p.quantityUnit,
				guaranteedAnalysis: p.guaranteedAnalysis,
			})),
		};
	}

	private sanitizeEntryLean(entry: MappedEntry) {
		return {
			id: entry.id,
			date: format(entry.date, "yyyy-MM-dd"),
			activities: entry.activities.map((a) => a.name),
			lawnSegments: entry.lawnSegments.map((s) => s.name),
			hasProducts: entry.products.length > 0,
		};
	}

	public async searchEntries(
		userId: string,
		params: {
			dateRange?: { startDate: string; endDate: string };
			activities?: number[];
			lawnSegments?: number[];
			products?: number[];
			productCategories?: string[];
			titleOrNotes?: string;
		},
	) {
		let productIds = params.products || ([] as number[]);

		if (params.productCategories?.length) {
			const categoryProducts = await Promise.all(
				params.productCategories.map((cat) => this.listProducts(userId, cat)),
			);

			const categoryIds = categoryProducts
				.flat()
				.map((p) => p.id)
				.filter((id): id is number => id != null);

			productIds = [...new Set([...productIds, ...categoryIds])];
		}

		const result = await this.entriesService.searchEntries(userId, {
			dateRange: params.dateRange
				? [params.dateRange.startDate, params.dateRange.endDate]
				: ([] as string[]),
			activities: params.activities || ([] as number[]),
			lawnSegments: params.lawnSegments || ([] as number[]),
			products: productIds,
			titleOrNotes: params.titleOrNotes || "",
		});

		if (result.isError()) {
			throw new Error("Failed to search entries");
		}

		const entries = result.value as MappedEntry[];
		const totalCount = entries.length;

		if (totalCount > FULL_DETAIL_THRESHOLD) {
			return {
				totalCount,
				note: "Large result set — returning lean format. Call get_entry_by_id for full details on a specific entry.",
				entries: entries.map((e) => this.sanitizeEntryLean(e)),
			};
		}

		return {
			totalCount,
			entries: entries.map((e) => this.sanitizeEntry(e)),
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

		let filteredProducts = products;

		if (category) {
			filteredProducts = products.filter((p) => p.category === category);
		}

		return filteredProducts.map((p) => ({
			id: p.id,
			name: p.name,
			brand: p.brand,
			category: p.category,
		}));
	}

	public async listLawnSegments(userId: string) {
		const segments = await this.lawnSegmentsService.getLawnSegments(userId);

		return segments.map((s) => ({
			id: s.id,
			name: s.name,
			size: s.size,
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

		return this.sanitizeEntry(entry);
	}

	public getToolDefinitions() {
		return [
			{
				name: "search_entries",
				description:
					"Search user's lawn care entries with flexible filtering. Returns entries sorted by date (newest first). IMPORTANT: If no dateRange is provided, results are limited to the current year. You MUST explicitly provide dateRange when the user asks about a past year, specific year, or any timeframe outside the current year.",
				parameters: {
					type: "object" as const,
					properties: {
						dateRange: {
							type: "object" as const,
							description: "Date range filter",
							properties: {
								startDate: {
									type: "string" as const,
									description: "Start date (YYYY-MM-DD)",
								},
								endDate: {
									type: "string" as const,
									description: "End date (YYYY-MM-DD)",
								},
							},
						},
						activities: {
							type: "array" as const,
							description: `Filter by activity IDs: ${ACTIVITY_IDS.MOW}=Mow, ${ACTIVITY_IDS.EDGE}=Edge, ${ACTIVITY_IDS.TRIM}=Trim, ${ACTIVITY_IDS.DETHATCH}=Dethatch, ${ACTIVITY_IDS.BLOW}=Blow, ${ACTIVITY_IDS.AERATE}=Aerate, ${ACTIVITY_IDS.WATER}=Water, ${ACTIVITY_IDS.LAWN_LEVELING}=Lawn Leveling, ${ACTIVITY_IDS.PRODUCT_APPLICATION}=Product Application`,
							items: { type: "number" as const },
						},
						lawnSegments: {
							type: "array" as const,
							description:
								"Filter by lawn segment IDs (get from list_lawn_segments first)",
							items: { type: "number" as const },
						},
						products: {
							type: "array" as const,
							description:
								"Filter by specific product IDs (get from list_products first, only when the user asks about a specific product by name)",
							items: { type: "number" as const },
						},
						productCategories: {
							type: "array" as const,
							description:
								"Filter by product categories — use this when the user asks about a type of product (e.g. 'fertilizer', 'pre-emergent'). Prefer this over list_products + products for category-based queries.",
							items: {
								type: "string" as const,
								enum: [
									"fertilizer",
									"pre-emergent",
									"post-emergent",
									"bio-stimulant",
									"insect-control",
									"plant-fertilizer",
									"seed",
									"fungus-control",
									"pgr",
									"other",
								],
							},
						},
						titleOrNotes: {
							type: "string" as const,
							description:
								"Search text in entry titles and notes (case-insensitive)",
						},
					},
				},
			},
			{
				name: "get_last_activity_date",
				description:
					"Get the date when a specific lawn care activity was last performed",
				parameters: {
					type: "object" as const,
					required: ["activityType"],
					properties: {
						activityType: {
							type: "string" as const,
							enum: ["mow", "product_application", "pgr"],
							description: "Type of activity to check",
						},
					},
				},
			},
			{
				name: "list_products",
				description:
					"List all products the user has in their inventory. Only use this when you need the specific product name or ID for a product the user mentioned by name.",
				parameters: {
					type: "object" as const,
					properties: {
						category: {
							type: "string" as const,
							enum: [
								"fertilizer",
								"pre-emergent",
								"post-emergent",
								"bio-stimulant",
								"insect-control",
								"plant-fertilizer",
								"seed",
								"fungus-control",
								"pgr",
								"other",
							],
							description: "Filter by product category (optional)",
						},
					},
				},
			},
			{
				name: "list_lawn_segments",
				description:
					"List all lawn segments/areas the user has defined. Use this before searching entries by lawn segment.",
				parameters: {
					type: "object" as const,
					properties: {},
				},
			},
			{
				name: "get_entry_by_id",
				description:
					"Get detailed information about a specific entry when you have the entry ID",
				parameters: {
					type: "object" as const,
					required: ["entryId"],
					properties: {
						entryId: {
							type: "number" as const,
							description: "The ID of the entry to retrieve",
						},
					},
				},
			},
		];
	}

	public async executeTool(
		userId: string,
		toolName: string,
		args: Record<string, unknown>,
	): Promise<unknown> {
		switch (toolName) {
			case "search_entries":
				return this.searchEntries(
					userId,
					args as Parameters<typeof this.searchEntries>[1],
				);
			case "get_last_activity_date":
				return this.getLastActivityDate(
					userId,
					args.activityType as "mow" | "product_application" | "pgr",
				);
			case "list_products":
				return this.listProducts(userId, args.category as string | undefined);
			case "list_lawn_segments":
				return this.listLawnSegments(userId);
			case "get_entry_by_id":
				return this.getEntryById(userId, args.entryId as number);
			default:
				throw new Error(`Unknown tool: ${toolName}`);
		}
	}
}
