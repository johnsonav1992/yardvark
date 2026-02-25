import type { Content } from "@google/genai";
import { FunctionCallingConfigMode, GoogleGenAI } from "@google/genai";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LogHelpers } from "../../../logger/logger.helpers";
import { BusinessContextKeys } from "../../../logger/logger-keys.constants";
import type { AiChatResponse, AiStreamEvent } from "../../../types/ai.types";
import type { AiToolDefinition } from "../models/ai-tool.types";
import { ENTRY_QUERY_TOOL_STATUS_MESSAGES } from "../utils/entry-query-tools.config";
import {
	buildFunctionDeclarations,
	executeToolCallsToResponseParts,
	getFunctionCallParts,
} from "../utils/gemini-tool-calling.utils";

interface GeminiChatMessage {
	role: "user" | "system" | "assistant";
	content: string;
}

interface GeminiChatOptions {
	model?: string;
	temperature?: number;
	maxOutputTokens?: number;
	topP?: number;
	topK?: number;
	stopSequences?: string[];
}

const TOOL_CALL_MAX_ITERATIONS = 8;

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
		const modelName = options?.model || this.defaultModel;
		LogHelpers.addBusinessContext(BusinessContextKeys.aiModel, modelName);
		LogHelpers.addBusinessContext(BusinessContextKeys.aiProvider, "gemini");

		const start = Date.now();
		let success = true;

		try {
			const formattedMessages = this.formatMessagesForGemini(messages);

			const response = await this.genAI.models.generateContent({
				model: modelName,
				contents: formattedMessages,
				config: {
					temperature: options?.temperature ?? 0.7,
					maxOutputTokens: options?.maxOutputTokens ?? 150,
					topP: options?.topP,
					topK: options?.topK,
					stopSequences: options?.stopSequences,
				},
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
					temperature: options?.temperature ?? 0.7,
					maxTokens: options?.maxOutputTokens ?? 150,
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

	private getBaseGenerationConfig(options?: GeminiChatOptions) {
		return {
			temperature: options?.temperature ?? 0.7,
			maxOutputTokens: options?.maxOutputTokens ?? 800,
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
		const modelName = options?.model || this.defaultModel;
		LogHelpers.addBusinessContext(BusinessContextKeys.aiModel, modelName);
		LogHelpers.addBusinessContext(BusinessContextKeys.aiProvider, "gemini");
		LogHelpers.addBusinessContext(BusinessContextKeys.aiStreaming, true);

		const start = Date.now();
		let success = true;

		try {
			const formattedMessages = this.formatMessagesForGemini(messages);

			const stream = await this.genAI.models.generateContentStream({
				model: modelName,
				contents: formattedMessages,
				config: {
					temperature: options?.temperature ?? 0.7,
					maxOutputTokens: options?.maxOutputTokens ?? 800,
					topP: options?.topP,
					topK: options?.topK,
					stopSequences: options?.stopSequences,
				},
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
		prompt: string,
		tools: AiToolDefinition[],
		toolExecutor: (
			name: string,
			args: Record<string, unknown>,
		) => Promise<unknown>,
		systemPrompt?: string,
		options?: GeminiChatOptions,
	): Promise<string> {
		const modelName = this.getModelName(options);
		LogHelpers.addBusinessContext(BusinessContextKeys.aiModel, modelName);
		LogHelpers.addBusinessContext(BusinessContextKeys.aiProvider, "gemini");
		LogHelpers.addBusinessContext("aiToolsEnabled", true);

		const start = Date.now();
		let success = true;

		try {
			const functionDeclarations = buildFunctionDeclarations(tools);

			const contents: Content[] = [{ role: "user", parts: [{ text: prompt }] }];

			for (
				let iteration = 0;
				iteration < TOOL_CALL_MAX_ITERATIONS;
				iteration++
			) {
				const response = await this.genAI.models.generateContent({
					model: modelName,
					contents,
					config: {
						systemInstruction: systemPrompt,
						...this.getBaseGenerationConfig(options),
						tools: [{ functionDeclarations }],
						toolConfig: {
							functionCallingConfig: {
								mode: FunctionCallingConfigMode.AUTO,
							},
						},
					},
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

					LogHelpers.addBusinessContext(
						"aiTokensUsed",
						response.usageMetadata?.totalTokenCount,
					);

					return text;
				}

				const functionResponseParts = await executeToolCallsToResponseParts(
					functionCallParts,
					toolExecutor,
				);

				contents.push({ role: "user", parts: functionResponseParts });
			}

			throw new Error("Max iterations reached without a final response");
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

	public async *streamChatWithTools(
		prompt: string,
		tools: AiToolDefinition[],
		toolExecutor: (
			name: string,
			args: Record<string, unknown>,
		) => Promise<unknown>,
		systemPrompt?: string,
		options?: GeminiChatOptions,
	): AsyncGenerator<AiStreamEvent> {
		const modelName = this.getModelName(options);
		LogHelpers.addBusinessContext(BusinessContextKeys.aiModel, modelName);
		LogHelpers.addBusinessContext(BusinessContextKeys.aiProvider, "gemini");
		LogHelpers.addBusinessContext("aiToolsEnabled", true);
		LogHelpers.addBusinessContext("aiStreaming", true);

		const start = Date.now();
		let success = true;

		try {
			const functionDeclarations = buildFunctionDeclarations(tools);

			const contents: Content[] = [{ role: "user", parts: [{ text: prompt }] }];

			for (
				let iteration = 0;
				iteration < TOOL_CALL_MAX_ITERATIONS;
				iteration++
			) {
				const response = await this.genAI.models.generateContent({
					model: modelName,
					contents,
					config: {
						systemInstruction: systemPrompt,
						...this.getBaseGenerationConfig(options),
						tools: [{ functionDeclarations }],
						toolConfig: {
							functionCallingConfig: {
								mode: FunctionCallingConfigMode.AUTO,
							},
						},
					},
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

					LogHelpers.addBusinessContext(
						"aiTokensUsed",
						response.usageMetadata?.totalTokenCount,
					);

					yield { type: "chunk", text };
					yield { type: "done" };
					return;
				}

				for (const part of functionCallParts) {
					yield {
						type: "status",
						message: this.getToolStatusMessage(
							part.functionCall.name ?? "unknown_tool",
						),
					};
				}

				const functionResponseParts = await executeToolCallsToResponseParts(
					functionCallParts,
					toolExecutor,
				);

				contents.push({ role: "user", parts: functionResponseParts });
			}

			throw new Error("Max iterations reached without a final response");
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
}
