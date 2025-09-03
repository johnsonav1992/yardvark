export interface AiChatResponse {
  content: string;
  model?: string;
  provider: 'groq' | 'gemini' | 'openai' | 'anthropic' | 'other';
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

export interface AiChatRequest {
  prompt: string;
  systemPrompt?: string;
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    [key: string]: any;
  };
}
