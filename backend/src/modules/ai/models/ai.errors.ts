import {
  ResourceError,
  ResourceValidationError,
} from '../../../errors/resource-error';

export class AiChatError extends ResourceError {
  constructor(originalError?: Error | unknown) {
    super({
      message: 'Failed to generate AI response',
      code: 'AI_CHAT_ERROR',
      statusCode: 500,
      error: originalError,
    });
  }
}

export class AiQueryError extends ResourceError {
  constructor(originalError?: Error | unknown) {
    super({
      message: 'Failed to process entry query',
      code: 'AI_QUERY_ERROR',
      statusCode: 500,
      error: originalError,
    });
  }
}

export class AiEmbeddingError extends ResourceError {
  constructor(originalError?: Error | unknown) {
    super({
      message: 'Failed to initialize embeddings',
      code: 'AI_EMBEDDING_ERROR',
      statusCode: 500,
      error: originalError,
    });
  }
}

export class PromptRequired extends ResourceValidationError {
  constructor() {
    super({
      message: 'Prompt is required',
      code: 'PROMPT_REQUIRED',
    });
  }
}

export class QueryRequired extends ResourceValidationError {
  constructor() {
    super({
      message: 'Query is required',
      code: 'QUERY_REQUIRED',
    });
  }
}
