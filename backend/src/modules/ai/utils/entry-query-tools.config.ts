import { ACTIVITY_IDS } from "../../../constants/activities.constants";
import type { AiToolDefinition } from "../models/ai-tool.types";

export const ENTRY_QUERY_FULL_DETAIL_THRESHOLD = 50;

export const ENTRY_QUERY_PRODUCT_CATEGORIES = [
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
] as const;

export const ENTRY_QUERY_TOOL_STATUS_MESSAGES: Record<string, string> = {
	search_entries: "Searching your entries...",
	get_last_activity_date: "Checking activity history...",
	list_products: "Looking up your products...",
	list_lawn_segments: "Loading your lawn areas...",
	get_entry_by_id: "Loading entry details...",
};

export type EntryQueryToolName =
	| "search_entries"
	| "get_last_activity_date"
	| "list_products"
	| "list_lawn_segments"
	| "get_entry_by_id";

const ENTRY_QUERY_TOOL_NAMES: EntryQueryToolName[] = [
	"search_entries",
	"get_last_activity_date",
	"list_products",
	"list_lawn_segments",
	"get_entry_by_id",
];

export const isEntryQueryToolName = (
	toolName: string,
): toolName is EntryQueryToolName =>
	ENTRY_QUERY_TOOL_NAMES.includes(toolName as EntryQueryToolName);

export const getEntryQueryToolDefinitions =
	(): AiToolDefinition<EntryQueryToolName>[] => [
		{
			name: "search_entries",
			description:
				"Search user's lawn care entries with flexible filtering. Returns entries sorted by date (newest first). IMPORTANT: If no dateRange is provided, results are limited to the current year. You MUST explicitly provide dateRange when the user asks about a past year, specific year, or any timeframe outside the current year.",
			parameters: {
				type: "object",
				properties: {
					dateRange: {
						type: "object",
						description: "Date range filter",
						properties: {
							startDate: {
								type: "string",
								description: "Start date (YYYY-MM-DD)",
							},
							endDate: {
								type: "string",
								description: "End date (YYYY-MM-DD)",
							},
						},
					},
					activities: {
						type: "array",
						description: `Filter by activity IDs: ${ACTIVITY_IDS.MOW}=Mow, ${ACTIVITY_IDS.EDGE}=Edge, ${ACTIVITY_IDS.TRIM}=Trim, ${ACTIVITY_IDS.DETHATCH}=Dethatch, ${ACTIVITY_IDS.BLOW}=Blow, ${ACTIVITY_IDS.AERATE}=Aerate, ${ACTIVITY_IDS.WATER}=Water, ${ACTIVITY_IDS.LAWN_LEVELING}=Lawn Leveling, ${ACTIVITY_IDS.PRODUCT_APPLICATION}=Product Application`,
						items: { type: "number" },
					},
					lawnSegments: {
						type: "array",
						description:
							"Filter by lawn segment IDs (get from list_lawn_segments first)",
						items: { type: "number" },
					},
					products: {
						type: "array",
						description:
							"Filter by specific product IDs (get from list_products first, only when the user asks about a specific product by name)",
						items: { type: "number" },
					},
					productCategories: {
						type: "array",
						description:
							"Filter by product categories — use this when the user asks about a type of product (e.g. 'fertilizer', 'pre-emergent'). Prefer this over list_products + products for category-based queries.",
						items: {
							type: "string",
							enum: ENTRY_QUERY_PRODUCT_CATEGORIES,
						},
					},
					titleOrNotes: {
						type: "string",
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
				type: "object",
				required: ["activityType"],
				properties: {
					activityType: {
						type: "string",
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
				type: "object",
				properties: {
					category: {
						type: "string",
						enum: ENTRY_QUERY_PRODUCT_CATEGORIES,
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
				type: "object",
				properties: {},
			},
		},
		{
			name: "get_entry_by_id",
			description:
				"Get detailed information about a specific entry when you have the entry ID",
			parameters: {
				type: "object",
				required: ["entryId"],
				properties: {
					entryId: {
						type: "number",
						description: "The ID of the entry to retrieve",
					},
				},
			},
		},
	];
