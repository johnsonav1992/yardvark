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
