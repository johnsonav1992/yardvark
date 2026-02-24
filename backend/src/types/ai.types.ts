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

export type AiStreamEvent =
	| { type: "status"; message: string }
	| { type: "chunk"; text: string }
	| { type: "done" }
	| { type: "error"; message: string };
