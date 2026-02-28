import type { Content } from "@google/genai";
import { FunctionCallingConfigMode, GoogleGenAI } from "@google/genai";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LogHelpers } from "../../../logger/logger.helpers";
import { BusinessContextKeys } from "../../../logger/logger-keys.constants";
import type { AiChatResponse, AiStreamEvent } from "../../../types/ai.types";
import type {
	GeminiChatMessage,
	GeminiChatOptions,
	GeminiChatWithToolsParams,
	GeminiStreamChatWithToolsParams,
} from "../models/gemini.types";
import { ENTRY_QUERY_TOOL_STATUS_MESSAGES } from "../utils/entry-query-tools.config";
import {
	buildFunctionDeclarations,
	executeToolCallsToResponseParts,
	getFunctionCallParts,
} from "../utils/gemini-tool-calling.utils";

interface ToolCallingLoopParams extends GeminiChatWithToolsParams {
	priorContents?: Content[];
}

type ToolCallingLoopEvent =
	| { type: "tool_call"; toolName: string }
	| { type: "final"; text: string; totalTokens?: number };

const TOOL_CALL_MAX_ITERATIONS = 8;
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_CHAT_MAX_OUTPUT_TOKENS = 150;
const DEFAULT_STREAM_MAX_OUTPUT_TOKENS = 800;

@Injectable()
export class GeminiService {
	private readonly genAI: GoogleGenAI;
	private readonly defaultModel: string;

	constructor(private readonly configService: ConfigService) {
		const apiKey = this.configService.get<string>("GEMINI_API_KEY");

		if (!apiKey) {
			throw new Error("GEMINI_API_KEY is required");
		}

		this.genAI = new GoogleGenAI({ apiKey });

		this.defaultModel =
			this.configService.get<string>("GEMINI_DEFAULT_MODEL") ||
			"gemini-2.0-flash";
	}

	public get genAIInstance(): GoogleGenAI {
		return this.genAI;
	}

	public async chat(
		messages: GeminiChatMessage[],
		options?: GeminiChatOptions,
	): Promise<AiChatResponse> {
		const modelName = this.getModelName(options);
		this.setGeminiLogContext({ modelName });

		const start = Date.now();
		let success = true;

		try {
			const formattedMessages = this.formatMessagesForGemini(messages);

			const response = await this.genAI.models.generateContent({
				model: modelName,
				contents: formattedMessages,
				config: this.getBaseGenerationConfig({
					options,
					defaultMaxOutputTokens: DEFAULT_CHAT_MAX_OUTPUT_TOKENS,
				}),
			});

			const content = response.text;

			if (!content) {
				throw new Error("No content in Gemini response");
			}

			const cleanContent = content.replace(/^["']|["']$/g, "").trim();

			LogHelpers.addBusinessContext(
				"aiTokensUsed",
				response.usageMetadata?.totalTokenCount,
			);

			return {
				content: cleanContent,
				model: modelName,
				provider: "gemini",
				usage: {
					promptTokens: response.usageMetadata?.candidatesTokenCount,
					completionTokens: response.usageMetadata?.promptTokenCount,
					totalTokens: response.usageMetadata?.totalTokenCount,
				},
				metadata: {
					temperature: options?.temperature ?? DEFAULT_TEMPERATURE,
					maxTokens:
						options?.maxOutputTokens ?? DEFAULT_CHAT_MAX_OUTPUT_TOKENS,
					finishReason: response.candidates?.[0]?.finishReason,
				},
			};
		} catch (error) {
			success = false;
			const message = error instanceof Error ? error.message : "Unknown error";

			throw new Error(`Gemini API error: ${message}`);
		} finally {
			LogHelpers.recordExternalCall("gemini", Date.now() - start, success);
		}
	}

	private formatMessagesForGemini(messages: GeminiChatMessage[]): string {
		return messages
			.map((msg) => {
				if (msg.role === "system") {
					return `System: ${msg.content}`;
				} else if (msg.role === "user") {
					return `User: ${msg.content}`;
				} else {
					return `Assistant: ${msg.content}`;
				}
			})
			.join("\n\n");
	}

	private getModelName(options?: GeminiChatOptions): string {
		return options?.model || this.defaultModel;
	}

	private getBaseGenerationConfig({
		options,
		defaultMaxOutputTokens,
	}: {
		options?: GeminiChatOptions;
		defaultMaxOutputTokens: number;
	}) {
		return {
			temperature: options?.temperature ?? DEFAULT_TEMPERATURE,
			maxOutputTokens: options?.maxOutputTokens ?? defaultMaxOutputTokens,
			topP: options?.topP,
			topK: options?.topK,
			stopSequences: options?.stopSequences,
		};
	}

	public async simpleChat(
		prompt: string,
		options?: GeminiChatOptions,
	): Promise<AiChatResponse> {
		return this.chat([{ role: "user", content: prompt }], options);
	}

	public async chatWithSystem(
		systemPrompt: string,
		userPrompt: string,
		options?: GeminiChatOptions,
	): Promise<AiChatResponse> {
		return this.chat(
			[
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userPrompt },
			],
			options,
		);
	}

	public async *streamChat(
		messages: GeminiChatMessage[],
		options?: GeminiChatOptions,
	): AsyncGenerator<{ content: string; done: boolean }, void, unknown> {
		const modelName = this.getModelName(options);
		this.setGeminiLogContext({ modelName, streaming: true });

		const start = Date.now();
		let success = true;

		try {
			const formattedMessages = this.formatMessagesForGemini(messages);

			const stream = await this.genAI.models.generateContentStream({
				model: modelName,
				contents: formattedMessages,
				config: this.getBaseGenerationConfig({
					options,
					defaultMaxOutputTokens: DEFAULT_STREAM_MAX_OUTPUT_TOKENS,
				}),
			});

			for await (const chunk of stream) {
				const content = chunk.text;

				if (content) {
					yield { content, done: false };
				}
			}

			yield { content: "", done: true };
		} catch (error) {
			success = false;
			const message = error instanceof Error ? error.message : "Unknown error";
			throw new Error(`Gemini streaming error: ${message}`);
		} finally {
			LogHelpers.recordExternalCall(
				"gemini-stream",
				Date.now() - start,
				success,
			);
		}
	}

	public async *streamChatWithSystem(
		systemPrompt: string,
		userPrompt: string,
		options?: GeminiChatOptions,
	): AsyncGenerator<{ content: string; done: boolean }, void, unknown> {
		yield* this.streamChat(
			[
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userPrompt },
			],
			options,
		);
	}

	public async chatWithTools(
		params: GeminiChatWithToolsParams,
	): Promise<string> {
		const modelName = this.getModelName(params.options);
		this.setGeminiLogContext({ modelName, toolsEnabled: true });

		const start = Date.now();
		let success = true;

		try {
			for await (const event of this.runToolCallingLoop(params)) {
				if (event.type === "final") {
					LogHelpers.addBusinessContext("aiTokensUsed", event.totalTokens);
					return event.text;
				}
			}

			throw new Error("Tool loop completed without final response");
		} catch (error) {
			success = false;
			const message = error instanceof Error ? error.message : "Unknown error";
			throw new Error(`Gemini tool calling error: ${message}`);
		} finally {
			LogHelpers.recordExternalCall(
				"gemini-tools",
				Date.now() - start,
				success,
			);
		}
	}

	public async *streamChatWithTools({
		prompt,
		tools,
		toolExecutor,
		systemPrompt,
		options,
		priorContents,
	}: GeminiStreamChatWithToolsParams): AsyncGenerator<AiStreamEvent> {
		const modelName = this.getModelName(options);
		this.setGeminiLogContext({
			modelName,
			toolsEnabled: true,
			streaming: true,
		});

		const start = Date.now();
		let success = true;

		try {
			for await (const event of this.runToolCallingLoop({
				prompt,
				tools,
				toolExecutor,
				systemPrompt,
				options,
				priorContents,
			})) {
				if (event.type === "tool_call") {
					yield {
						type: "status",
						message: this.getToolStatusMessage(event.toolName),
					};
					continue;
				}

				LogHelpers.addBusinessContext("aiTokensUsed", event.totalTokens);
				yield { type: "chunk", text: event.text };
				yield { type: "done" };
				return;
			}

			throw new Error("Tool loop completed without final response");
		} catch (error) {
			success = false;
			const message = error instanceof Error ? error.message : "Unknown error";
			yield { type: "error", message };
		} finally {
			LogHelpers.recordExternalCall(
				"gemini-stream-tools",
				Date.now() - start,
				success,
			);
		}
	}

	private getToolStatusMessage(toolName: string): string {
		return ENTRY_QUERY_TOOL_STATUS_MESSAGES[toolName] ?? "Thinking...";
	}

	private setGeminiLogContext({
		modelName,
		streaming = false,
		toolsEnabled = false,
	}: {
		modelName: string;
		streaming?: boolean;
		toolsEnabled?: boolean;
	}): void {
		LogHelpers.addBusinessContext(BusinessContextKeys.aiModel, modelName);
		LogHelpers.addBusinessContext(BusinessContextKeys.aiProvider, "gemini");

		if (streaming) {
			LogHelpers.addBusinessContext(BusinessContextKeys.aiStreaming, true);
		}

		if (toolsEnabled) {
			LogHelpers.addBusinessContext("aiToolsEnabled", true);
		}
	}

	private buildToolCallingConfig({
		functionDeclarations,
		systemPrompt,
		options,
	}: {
		functionDeclarations: ReturnType<typeof buildFunctionDeclarations>;
		systemPrompt?: string;
		options?: GeminiChatOptions;
	}) {
		return {
			systemInstruction: systemPrompt,
			...this.getBaseGenerationConfig({
				options,
				defaultMaxOutputTokens: DEFAULT_STREAM_MAX_OUTPUT_TOKENS,
			}),
			tools: [{ functionDeclarations }],
			toolConfig: {
				functionCallingConfig: {
					mode: FunctionCallingConfigMode.AUTO,
				},
			},
		};
	}

	private async *runToolCallingLoop({
		prompt,
		tools,
		toolExecutor,
		systemPrompt,
		options,
		priorContents,
	}: ToolCallingLoopParams): AsyncGenerator<ToolCallingLoopEvent> {
		const modelName = this.getModelName(options);
		const functionDeclarations = buildFunctionDeclarations(tools);
		const contents: Content[] = [
			...(priorContents ?? []),
			{ role: "user", parts: [{ text: prompt }] },
		];

		for (let iteration = 0; iteration < TOOL_CALL_MAX_ITERATIONS; iteration++) {
			const response = await this.genAI.models.generateContent({
				model: modelName,
				contents,
				config: this.buildToolCallingConfig({
					functionDeclarations,
					systemPrompt,
					options,
				}),
			});

			const candidate = response.candidates?.[0];

			if (!candidate?.content) {
				throw new Error("No candidate content in Gemini response");
			}

			contents.push(candidate.content);

			const functionCallParts = getFunctionCallParts(candidate.content.parts);

			if (functionCallParts.length === 0) {
				const text = response.text;

				if (!text) {
					throw new Error("No text or function calls in Gemini response");
				}

				yield {
					type: "final",
					text,
					totalTokens: response.usageMetadata?.totalTokenCount,
				};
				return;
			}

			for (const part of functionCallParts) {
				yield {
					type: "tool_call",
					toolName: part.functionCall.name ?? "unknown_tool",
				};
			}

			const functionResponseParts = await executeToolCallsToResponseParts(
				functionCallParts,
				toolExecutor,
			);

			contents.push({ role: "user", parts: functionResponseParts });
		}

		throw new Error("Max iterations reached without a final response");
	}
}
