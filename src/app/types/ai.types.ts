export interface AiChatResponse {
	content: string;
	model?: string;
	provider: "groq" | "openai" | "anthropic" | "gemini" | "other";
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

export interface AiEntryQueryLimitStatus {
	limit: number;
	used: number;
	remaining: number;
	resetAt: string;
}

export type AiStreamEvent =
	| { type: "status"; message: string }
	| { type: "limit"; data: AiEntryQueryLimitStatus }
	| { type: "chunk"; text: string }
	| { type: "done" }
	| { type: "error"; message: string };
