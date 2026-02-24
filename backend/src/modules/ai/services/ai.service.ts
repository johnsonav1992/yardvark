import { Injectable } from "@nestjs/common";
import { format } from "date-fns";
import type { AiChatResponse, AiStreamEvent } from "../../../types/ai.types";
import { type Either, error, success } from "../../../types/either";
import { AiChatError } from "../models/ai.errors";
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
			const systemPrompt = this.buildSystemPrompt();
			const toolsUsed: string[] = [];

			const toolExecutor = async (
				name: string,
				args: Record<string, unknown>,
			) => {
				toolsUsed.push(name);

				return this.entryQueryToolsService.executeTool(userId, name, args);
			};

			const content = await this.geminiService.chatWithTools(
				query,
				tools,
				toolExecutor,
				systemPrompt,
				{ maxOutputTokens: 800 },
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
		const systemPrompt = this.buildSystemPrompt();

		const toolExecutor = async (
			name: string,
			args: Record<string, unknown>,
		) => {
			return this.entryQueryToolsService.executeTool(userId, name, args);
		};

		yield* this.geminiService.streamChatWithTools(
			query,
			tools,
			toolExecutor,
			systemPrompt,
			{ maxOutputTokens: 800 },
		);
	}

	private buildSystemPrompt(): string {
		const currentDate = format(new Date(), "MMMM do, yyyy");

		return `You are a helpful lawn care assistant for Yardvark. You are talking TO the user about THEIR lawn care history.

Your role:
1. Use the provided tools to query the user's lawn care entries
2. Answer questions accurately based on ONLY the data returned from tools
3. Respond conversationally and naturally - don't just dump data
4. If you need to look up products or lawn segments before searching entries, do so
5. If no data matches the query, say so clearly
6. Include relevant dates, products, and details in your responses
7. Don't make recommendations or suggest actions - only answer about their historical data

Guidelines:
- Always use tools rather than guessing
- Always refer to the user's activities using "you/your" — e.g., "You last mowed on June 15th", never "I mowed on June 15th"
- Format dates in a friendly way (e.g., "June 15th" not "2024-06-15")
- Use natural language for counts (e.g., "three times" not "3")
- When listing multiple items, format them nicely
- If the user's question is ambiguous, make reasonable assumptions based on context
- When the user mentions a past year, "last year", or any specific year, ALWAYS pass an explicit dateRange in search_entries (e.g., for last year: startDate "YYYY-01-01", endDate "YYYY-12-31"). Never rely on the default date range for past-year queries.

Today's date: ${currentDate}`;
	}
}
