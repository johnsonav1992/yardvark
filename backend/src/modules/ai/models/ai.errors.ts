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

export class AiQueryError extends ResourceError {
	constructor(originalError?: Error | unknown) {
		super({
			message: "Failed to process entry query",
			code: "AI_QUERY_ERROR",
			statusCode: 500,
			error: originalError,
		});
	}
}

export class AiEmbeddingError extends ResourceError {
	constructor(originalError?: Error | unknown) {
		super({
			message: "Failed to initialize embeddings",
			code: "AI_EMBEDDING_ERROR",
			statusCode: 500,
			error: originalError,
		});
	}
}
