import type { Content } from "@google/genai";
import type { AiToolDefinition } from "./ai-tool.types";

export interface GeminiChatMessage {
	role: "user" | "system" | "assistant";
	content: string;
}

export interface GeminiChatOptions {
	model?: string;
	temperature?: number;
	maxOutputTokens?: number;
	topP?: number;
	topK?: number;
	stopSequences?: string[];
}

export type GeminiToolExecutor = (
	name: string,
	args: Record<string, unknown>,
) => Promise<unknown>;

export interface GeminiChatWithToolsParams {
	prompt: string;
	tools: AiToolDefinition[];
	toolExecutor: GeminiToolExecutor;
	systemPrompt?: string;
	options?: GeminiChatOptions;
}

export interface GeminiStreamChatWithToolsParams
	extends GeminiChatWithToolsParams {
	priorContents?: Content[];
}
