import {
	Body,
	Controller,
	HttpException,
	HttpStatus,
	Post,
} from "@nestjs/common";
import { SubscriptionFeature } from "../../../decorators/subscription-feature.decorator";
import { User } from "../../../decorators/user.decorator";
import { LogHelpers } from "../../../logger/logger.helpers";
import { BusinessContextKeys } from "../../../logger/logger-keys.constants";
import type { AiChatRequest, AiChatResponse } from "../../../types/ai.types";
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

		return resultOrThrow(
			await this.aiService.queryEntriesWithTools(userId, body.query),
		);
	}
}
