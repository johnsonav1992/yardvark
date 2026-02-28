import { Injectable } from "@nestjs/common";
import type {
	AiChatResponse,
	AiEntryQueryLimitStatus,
	AiStreamEvent,
} from "../../../types/ai.types";
import { type Either, error, success } from "../../../types/either";
import { SubscriptionService } from "../../subscription/services/subscription.service";
import {
	AiChatAccessDeniedError,
	AiChatDailyLimitReachedError,
	AiChatError,
} from "../models/ai.errors";
import {
	ENTRY_QUERY_DAILY_LIMIT_FEATURE,
	getEntryQueryChatOptions,
} from "../utils/entry-query-ai.config";
import { buildEntryQuerySystemPrompt } from "../utils/entry-query-prompt.utils";
import { isEntryQueryToolName } from "../utils/entry-query-tools.config";
import type { ProposeEntryParams } from "../utils/entry-query-tools.utils";
import { AiSessionService } from "./ai-session.service";
import { EntryQueryToolsService } from "./entry-query-tools.service";
import { GeminiService } from "./gemini.service";

@Injectable()
export class AiService {
	constructor(
		private readonly geminiService: GeminiService,
		private readonly entryQueryToolsService: EntryQueryToolsService,
		private readonly subscriptionService: SubscriptionService,
		private readonly sessionService: AiSessionService,
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
		sessionId?: string,
	): AsyncGenerator<AiStreamEvent> {
		const tools = this.entryQueryToolsService.getToolDefinitions();
		const sideEvents: AiStreamEvent[] = [];
		const priorContents = sessionId ? this.sessionService.getHistory(sessionId) : [];
		let finalText = "";

		const toolExecutor = this.createEntryQueryToolExecutor(
			userId,
			undefined,
			(event) => {
				sideEvents.push(event);
			},
		);

		for await (const event of this.geminiService.streamChatWithTools({
			prompt: query,
			tools,
			toolExecutor,
			systemPrompt: buildEntryQuerySystemPrompt(),
			options: getEntryQueryChatOptions(),
			priorContents,
		})) {
			while (sideEvents.length > 0) {
				yield sideEvents.shift()!;
			}

			if (event.type === "chunk") {
				finalText += event.text;
			}

			yield event;
		}

		while (sideEvents.length > 0) {
			yield sideEvents.shift()!;
		}

		if (sessionId && finalText) {
			this.sessionService.appendTurn(
				sessionId,
				{ role: "user", parts: [{ text: query }] },
				{ role: "model", parts: [{ text: finalText }] },
			);
		}
	}

	public async getEntryQueryLimitStatus(
		userId: string,
	): Promise<Either<AiChatError, AiEntryQueryLimitStatus>> {
		try {
			const accessResult = await this.subscriptionService.checkFeatureAccess(
				userId,
				ENTRY_QUERY_DAILY_LIMIT_FEATURE,
			);

			if (accessResult.isError()) {
				return error(new AiChatError(accessResult.value.error));
			}

			const access = accessResult.value;
			const usageResult = await this.subscriptionService.getCurrentFeatureUsage(
				userId,
				ENTRY_QUERY_DAILY_LIMIT_FEATURE,
			);

			if (usageResult.isError()) {
				return error(new AiChatError(usageResult.value.error));
			}

			const usage = usageResult.value;
			const limit = access.limit ?? 0;
			const used = usage.usage;

			return success({
				limit,
				used,
				remaining: Math.max(limit - used, 0),
				resetAt: usage.periodEnd.toISOString(),
			});
		} catch (err) {
			return error(new AiChatError(err));
		}
	}

	public async reserveEntryQueryMessage(
		userId: string,
	): Promise<Either<AiChatError, AiEntryQueryLimitStatus>> {
		try {
			const accessResult = await this.subscriptionService.checkFeatureAccess(
				userId,
				ENTRY_QUERY_DAILY_LIMIT_FEATURE,
			);

			if (accessResult.isError()) {
				return error(new AiChatError(accessResult.value.error));
			}

			const access = accessResult.value;

			if (!access.allowed) {
				if (access.limit !== undefined && access.usage !== undefined) {
					return error(
						new AiChatDailyLimitReachedError(access.usage, access.limit),
					);
				}

				return error(new AiChatAccessDeniedError());
			}

			const incrementResult = await this.subscriptionService.incrementUsage(
				userId,
				ENTRY_QUERY_DAILY_LIMIT_FEATURE,
			);

			if (incrementResult.isError()) {
				return error(new AiChatError(incrementResult.value.error));
			}

			return this.getEntryQueryLimitStatus(userId);
		} catch (err) {
			return error(new AiChatError(err));
		}
	}

	private createEntryQueryToolExecutor(
		userId: string,
		toolsUsed?: string[],
		onSideEvent?: (event: AiStreamEvent) => void,
	): (name: string, args: Record<string, unknown>) => Promise<unknown> {
		return async (name: string, args: Record<string, unknown>) => {
			if (!isEntryQueryToolName(name)) {
				throw new Error(`Unknown tool: ${name}`);
			}

			toolsUsed?.push(name);

			if (name === "propose_entry") {
				const draft = await this.entryQueryToolsService.proposeEntry(
					userId,
					args as unknown as ProposeEntryParams,
				);

				onSideEvent?.({ type: "entry_draft", data: draft });

				return {
					proposed: true,
					instruction:
						"The entry draft has been shown to the user for confirmation. Write a brief message telling them what you've prepared (date and activities) and ask them to confirm or let you know if anything needs to change.",
				};
			}

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
