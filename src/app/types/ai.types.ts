export interface AiChatResponse {
  content: string;
  model?: string;
  provider: 'groq' | 'openai' | 'anthropic' | 'other';
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  metadata?: {
    temperature?: number;
    maxTokens?: number;
    finishReason?: string;
    [key: string]: any;
  };
}
