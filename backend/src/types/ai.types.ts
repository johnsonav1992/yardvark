export interface AiChatResponse {
	content: string;
	model?: string;
	provider: "groq" | "gemini" | "openai" | "anthropic" | "other";
	usage?: {
		promptTokens?: number;
		completionTokens?: number;
		totalTokens?: number;
	};
	metadata?: {
		temperature?: number;
		maxTokens?: number;
		finishReason?: string;
		[key: string]: unknown;
	};
}

export interface AiChatRequest {
	prompt: string;
	systemPrompt?: string;
	options?: {
		model?: string;
		temperature?: number;
		maxTokens?: number;
		[key: string]: unknown;
	};
}

export interface AiEntryQueryLimitStatus {
	limit: number;
	used: number;
	remaining: number;
	resetAt: string;
}

export interface AiEntryDraftProduct {
	productId: number;
	productName: string;
	productQuantity: number;
	productQuantityUnit: string;
}

export interface AiEntryDraftData {
	date: string;
	time?: string;
	title?: string;
	notes: string;
	activityIds: number[];
	activityNames: string[];
	lawnSegmentIds: number[];
	lawnSegmentNames: string[];
	products: AiEntryDraftProduct[];
	mowingHeight?: number;
	mowingHeightUnit?: string;
	soilTemperature?: number;
	soilTemperatureUnit?: string;
}

export type AiStreamEvent =
	| { type: "status"; message: string }
	| { type: "limit"; data: AiEntryQueryLimitStatus }
	| { type: "chunk"; text: string }
	| { type: "entry_draft"; data: AiEntryDraftData }
	| { type: "done" }
	| { type: "error"; message: string };
