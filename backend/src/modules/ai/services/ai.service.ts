import { Injectable } from "@nestjs/common";
import { format } from "date-fns";
import type { AiChatResponse } from "../../../types/ai.types";
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
			console.log("Starting queryEntriesWithTools for userId:", userId, "query:", query);
			const tools = this.entryQueryToolsService.getToolDefinitions();
			console.log("Got tool definitions, count:", tools.length);
			const currentDate = format(new Date(), "MMMM do, yyyy");

			const systemPrompt = `You are a helpful lawn care assistant for Yardvark. Users will ask questions about their lawn care history.

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
- Format dates in a friendly way (e.g., "June 15th" not "2024-06-15")
- Use natural language for counts (e.g., "three times" not "3")
- When listing multiple items, format them nicely
- If the user's question is ambiguous, make reasonable assumptions based on context

Today's date: ${currentDate}`;

			const maxIterations = 5;
			let iteration = 0;
			const toolsUsed: string[] = [];
			let currentPrompt = query;
			const toolResults: string[] = [];

			while (iteration < maxIterations) {
				iteration++;

				const fullPrompt =
					toolResults.length > 0
						? `${currentPrompt}\n\nPrevious tool results:\n${toolResults.join("\n")}`
						: currentPrompt;

				const response = await this.geminiService.chatWithTools(
					fullPrompt,
					tools,
					systemPrompt,
					{ maxOutputTokens: 800 },
				);

				console.log("Gemini response:", JSON.stringify(response, null, 2));

				if (response.response) {
					return success({
						content: response.response,
						provider: "gemini",
						toolsUsed,
					});
				}

				if (response.toolCalls && response.toolCalls.length > 0) {
					for (const toolCall of response.toolCalls) {
						toolsUsed.push(toolCall.name);

						const result = await this.entryQueryToolsService.executeTool(
							userId,
							toolCall.name,
							toolCall.args,
						);

						toolResults.push(
							`Tool: ${toolCall.name}\nResult: ${JSON.stringify(result, null, 2)}`,
						);
					}

					currentPrompt = query;
				} else {
					throw new Error(
						"AI did not return a response or tool calls - this should not happen",
					);
				}
			}

			throw new Error("Max iterations reached without a final response");
		} catch (err) {
			console.error("Error in queryEntriesWithTools:", err);
			return error(new AiChatError(err));
		}
	}
}
