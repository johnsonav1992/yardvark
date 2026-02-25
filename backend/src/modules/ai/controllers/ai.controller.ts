import {
	Body,
	Controller,
	Get,
	HttpException,
	HttpStatus,
	Post,
	Res,
} from "@nestjs/common";
import type { Response } from "express";
import { SubscriptionFeature } from "../../../decorators/subscription-feature.decorator";
import { User } from "../../../decorators/user.decorator";
import { LogHelpers } from "../../../logger/logger.helpers";
import { BusinessContextKeys } from "../../../logger/logger-keys.constants";
import type {
	AiChatRequest,
	AiChatResponse,
	AiStreamEvent,
} from "../../../types/ai.types";
import { resultOrThrow } from "../../../utils/resultOrThrow";
import { AiService } from "../services/ai.service";

@Controller("ai")
export class AiController {
	constructor(private readonly aiService: AiService) {}

	@Post("chat")
	@SubscriptionFeature("ai_chat")
	public async chat(
		@Body() chatRequest: AiChatRequest,
	): Promise<AiChatResponse> {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"ai_chat",
		);

		if (!chatRequest.prompt || chatRequest.prompt.trim().length === 0) {
			throw new HttpException("Prompt is required", HttpStatus.BAD_REQUEST);
		}

		return resultOrThrow(await this.aiService.chat(chatRequest.prompt));
	}

	@Post("query-entries")
	public async queryEntries(
		@User("userId") userId: string,
		@Body() body: { query: string },
	): Promise<AiChatResponse & { toolsUsed?: string[] }> {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"ai_query_entries",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

		if (!body.query || body.query.trim().length === 0) {
			throw new HttpException("Query is required", HttpStatus.BAD_REQUEST);
		}

		resultOrThrow(await this.aiService.reserveEntryQueryMessage(userId));

		return resultOrThrow(
			await this.aiService.queryEntriesWithTools(userId, body.query),
		);
	}

	@Get("query-entries/limit")
	public async getQueryEntriesLimit(@User("userId") userId: string) {
		return resultOrThrow(await this.aiService.getEntryQueryLimitStatus(userId));
	}

	@Post("query-entries/stream")
	public async streamQueryEntries(
		@User("userId") userId: string,
		@Body() body: { query: string },
		@Res() res: Response,
	): Promise<void> {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"ai_query_entries_stream",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

		if (!body.query || body.query.trim().length === 0) {
			res.status(HttpStatus.BAD_REQUEST).json({ message: "Query is required" });
			return;
		}

		const reservationResult =
			await this.aiService.reserveEntryQueryMessage(userId);

		if (reservationResult.isError()) {
			res
				.status(reservationResult.value.statusCode)
				.json({ message: reservationResult.value.message });
			return;
		}

		res.setHeader("Content-Type", "text/event-stream");
		res.setHeader("Cache-Control", "no-cache");
		res.setHeader("Connection", "keep-alive");
		res.flushHeaders();

		try {
			const limitEvent: AiStreamEvent = {
				type: "limit",
				data: reservationResult.value,
			};
			res.write(`data: ${JSON.stringify(limitEvent)}\n\n`);

			for await (const event of this.aiService.streamQueryEntriesWithTools(
				userId,
				body.query,
			)) {
				res.write(`data: ${JSON.stringify(event)}\n\n`);
			}
		} finally {
			res.end();
		}
	}
}
