import { Injectable } from "@nestjs/common";
import type { AiChatResponse, AiStreamEvent } from "../../../types/ai.types";
import { type Either, error, success } from "../../../types/either";
import { AiChatError } from "../models/ai.errors";
import { getEntryQueryChatOptions } from "../utils/entry-query-ai.config";
import { buildEntryQuerySystemPrompt } from "../utils/entry-query-prompt.utils";
import { isEntryQueryToolName } from "../utils/entry-query-tools.config";
import { EntryQueryToolsService } from "./entry-query-tools.service";
import { GeminiService } from "./gemini.service";

@Injectable()
export class AiService {
	constructor(
		private readonly geminiService: GeminiService,
		private readonly entryQueryToolsService: EntryQueryToolsService,
	) {}

	public async chat(
		prompt: string,
	): Promise<Either<AiChatError, AiChatResponse>> {
		try {
			const response = await this.geminiService.simpleChat(prompt);

			return success(response);
		} catch (err) {
			return error(new AiChatError(err));
		}
	}

	public async chatWithSystem(
		systemPrompt: string,
		userPrompt: string,
	): Promise<Either<AiChatError, AiChatResponse>> {
		try {
			const response = await this.geminiService.chatWithSystem(
				systemPrompt,
				userPrompt,
			);

			return success(response);
		} catch (err) {
			return error(new AiChatError(err));
		}
	}

	public async queryEntriesWithTools(
		userId: string,
		query: string,
	): Promise<Either<AiChatError, AiChatResponse & { toolsUsed?: string[] }>> {
		try {
			const tools = this.entryQueryToolsService.getToolDefinitions();
			const toolsUsed: string[] = [];

			const content = await this.geminiService.chatWithTools(
				query,
				tools,
				this.createEntryQueryToolExecutor(userId, toolsUsed),
				buildEntryQuerySystemPrompt(),
				getEntryQueryChatOptions(),
			);

			return success({
				content,
				provider: "gemini",
				toolsUsed,
			});
		} catch (err) {
			return error(new AiChatError(err));
		}
	}

	public async *streamQueryEntriesWithTools(
		userId: string,
		query: string,
	): AsyncGenerator<AiStreamEvent> {
		const tools = this.entryQueryToolsService.getToolDefinitions();

		yield* this.geminiService.streamChatWithTools(
			query,
			tools,
			this.createEntryQueryToolExecutor(userId),
			buildEntryQuerySystemPrompt(),
			getEntryQueryChatOptions(),
		);
	}

	private createEntryQueryToolExecutor(
		userId: string,
		toolsUsed?: string[],
	): (name: string, args: Record<string, unknown>) => Promise<unknown> {
		return async (name: string, args: Record<string, unknown>) => {
			if (!isEntryQueryToolName(name)) {
				throw new Error(`Unknown tool: ${name}`);
			}

			toolsUsed?.push(name);
			const toolResult = await this.entryQueryToolsService.executeTool(
				userId,
				name,
				args,
			);

			if (toolResult.isError()) {
				const originalError = toolResult.value.error;
				const errorMessage =
					originalError instanceof Error
						? originalError.message
						: toolResult.value.message;
				throw new Error(errorMessage);
			}

			return toolResult.value;
		};
	}
}
