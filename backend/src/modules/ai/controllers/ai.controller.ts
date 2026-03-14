import { Body, Controller, Get, HttpStatus, Post, Res } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import { SubscriptionFeature } from "../../../decorators/subscription-feature.decorator";
import { User } from "../../../decorators/user.decorator";
import { ResourceValidationError } from "../../../errors/resource-error";
import { LogHelpers } from "../../../logger/logger.helpers";
import { BusinessContextKeys } from "../../../logger/logger-keys.constants";
import type {
	AiChatRequest,
	AiChatResponse,
	AiEntryQueryLimitStatus,
	AiStreamEvent,
} from "../../../types/ai.types";
import { error } from "../../../types/either";
import type { ExtractedUserRequestData } from "../../../types/request";
import { resultOrThrow } from "../../../utils/resultOrThrow";
import { AiService } from "../services/ai.service";

@Controller("ai")
export class AiController {
	constructor(private readonly aiService: AiService) {}

	@Post("chat")
	@Throttle({ default: { ttl: 60000, limit: 10 } })
	@SubscriptionFeature("ai_chat")
	public async chat(
		@Body() chatRequest: AiChatRequest,
	): Promise<AiChatResponse> {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"ai_chat",
		);

		if (!chatRequest.prompt || chatRequest.prompt.trim().length === 0) {
			this.throwValidationError("Prompt is required");
		}

		return resultOrThrow(await this.aiService.chat(chatRequest.prompt));
	}

	@Post("query-entries")
	@Throttle({ default: { ttl: 60000, limit: 10 } })
	@SubscriptionFeature("ai_chat")
	public async queryEntries(
		@User() user: ExtractedUserRequestData,
		@Body() body: { query: string },
	): Promise<AiChatResponse & { toolsUsed?: string[] }> {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"ai_query_entries",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, user.userId);

		if (!body.query || body.query.trim().length === 0) {
			this.throwValidationError("Query is required");
		}

		if (!user.isMaster) {
			resultOrThrow(await this.aiService.reserveEntryQueryMessage(user.userId));
		}

		return resultOrThrow(
			await this.aiService.queryEntriesWithTools(user.userId, body.query),
		);
	}

	@Get("query-entries/limit")
	@SubscriptionFeature("ai_chat")
	public async getQueryEntriesLimit(@User("userId") userId: string) {
		return resultOrThrow(await this.aiService.getEntryQueryLimitStatus(userId));
	}

	@Post("query-entries/stream")
	@Throttle({ default: { ttl: 60000, limit: 10 } })
	@SubscriptionFeature("ai_chat")
	public async streamQueryEntries(
		@User() user: ExtractedUserRequestData,
		@Body() body: { query: string; sessionId?: string },
		@Res() res: Response,
	): Promise<void> {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"ai_query_entries_stream",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, user.userId);

		if (!body.query || body.query.trim().length === 0) {
			res.status(HttpStatus.BAD_REQUEST).json({
				message: "Query is required",
				code: "AI_CHAT_VALIDATION_ERROR",
			});
			return;
		}

		let limitStatus: AiEntryQueryLimitStatus;

		if (user.isMaster) {
			limitStatus = {
				limit: 9999,
				used: 0,
				remaining: 9999,
				resetAt: new Date().toISOString(),
			};
		} else {
			const reservationResult = await this.aiService.reserveEntryQueryMessage(
				user.userId,
			);

			if (reservationResult.isError()) {
				res.status(reservationResult.value.statusCode).json({
					message: reservationResult.value.message,
					code: reservationResult.value.code,
				});
				return;
			}

			limitStatus = reservationResult.value;
		}

		res.setHeader("Content-Type", "text/event-stream");
		res.setHeader("Cache-Control", "no-cache");
		res.setHeader("Connection", "keep-alive");
		res.flushHeaders();

		try {
			const limitEvent: AiStreamEvent = {
				type: "limit",
				data: limitStatus,
			};
			res.write(`data: ${JSON.stringify(limitEvent)}\n\n`);

			for await (const event of this.aiService.streamQueryEntriesWithTools(
				user.userId,
				body.query,
				body.sessionId,
			)) {
				res.write(`data: ${JSON.stringify(event)}\n\n`);
			}
		} catch (err) {
			LogHelpers.addBusinessContext(
				BusinessContextKeys.streamError,
				err instanceof Error ? err.message : "unknown_stream_error",
			);
			const errorEvent: AiStreamEvent = {
				type: "error",
				message: "Sorry, something went wrong. Please try again.",
				code: "AI_CHAT_STREAM_ERROR",
			};
			res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
		} finally {
			res.end();
		}
	}

	private throwValidationError(message: string): never {
		return resultOrThrow(
			error(
				new ResourceValidationError({
					message,
					code: "AI_CHAT_VALIDATION_ERROR",
				}),
			),
		);
	}
}
