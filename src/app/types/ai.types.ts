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

export type AiStreamEvent =
	| { type: "status"; message: string }
	| { type: "chunk"; text: string }
	| { type: "done" }
	| { type: "error"; message: string };
