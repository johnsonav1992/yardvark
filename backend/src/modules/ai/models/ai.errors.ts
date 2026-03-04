import { ResourceError } from "../../../errors/resource-error";

export class AiChatError extends ResourceError {
	constructor(originalError?: Error | unknown) {
		super({
			message: "Failed to generate AI response",
			code: "AI_CHAT_ERROR",
			statusCode: 500,
			error: originalError,
		});
	}
}

export class AiChatAccessDeniedError extends ResourceError {
	constructor() {
		super({
			message: "AI features require a Pro subscription. Upgrade to unlock.",
			code: "AI_CHAT_SUBSCRIPTION_REQUIRED",
			statusCode: 402,
		});
	}
}

export class AiChatDailyLimitReachedError extends ResourceError {
	constructor(usage: number, limit: number) {
		super({
			message: `Daily AI message limit reached (${usage}/${limit}). Try again tomorrow.`,
			code: "AI_CHAT_DAILY_LIMIT_REACHED",
			statusCode: 402,
		});
	}
}
