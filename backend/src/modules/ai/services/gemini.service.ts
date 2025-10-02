import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { AiChatResponse } from '../../../types/ai.types';

interface GeminiChatMessage {
  role: 'user' | 'system' | 'assistant';
  content: string;
}

interface GeminiChatOptions {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
}

@Injectable()
export class GeminiService {
  private readonly genAI: GoogleGenAI;
  private readonly defaultModel: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }

    this.genAI = new GoogleGenAI({ apiKey });

    this.defaultModel =
      this.configService.get<string>('GEMINI_DEFAULT_MODEL') ||
      'gemini-2.0-flash';
  }

  get genAIInstance(): GoogleGenAI {
    return this.genAI;
  }

  async chat(
    messages: GeminiChatMessage[],
    options?: GeminiChatOptions,
  ): Promise<AiChatResponse> {
    try {
      const modelName = options?.model || this.defaultModel;
      const formattedMessages = this.formatMessagesForGemini(messages);

      const response = await this.genAI.models.generateContent({
        model: modelName,
        contents: formattedMessages,
        config: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxOutputTokens ?? 150,
          topP: options?.topP,
          topK: options?.topK,
          stopSequences: options?.stopSequences,
        },
      });

      const content = response.text;

      if (!content) {
        throw new Error('No content in Gemini response');
      }

      const cleanContent = content.replace(/^["']|["']$/g, '').trim();

      return {
        content: cleanContent,
        model: modelName,
        provider: 'gemini',
        usage: {
          promptTokens: response.usageMetadata?.candidatesTokenCount,
          completionTokens: response.usageMetadata?.promptTokenCount,
          totalTokens: response.usageMetadata?.totalTokenCount,
        },
        metadata: {
          temperature: options?.temperature ?? 0.7,
          maxTokens: options?.maxOutputTokens ?? 150,
          finishReason: response.candidates?.[0]?.finishReason,
        },
      };
    } catch (error) {
      console.error('Gemini API error:', error);

      const message = error instanceof Error ? error.message : 'Unknown error';

      throw new Error(`Gemini API error: ${message}`);
    }
  }

  private formatMessagesForGemini(messages: GeminiChatMessage[]): string {
    return messages
      .map((msg) => {
        if (msg.role === 'system') {
          return `System: ${msg.content}`;
        } else if (msg.role === 'user') {
          return `User: ${msg.content}`;
        } else {
          return `Assistant: ${msg.content}`;
        }
      })
      .join('\n\n');
  }

  async simpleChat(
    prompt: string,
    options?: GeminiChatOptions,
  ): Promise<AiChatResponse> {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  async chatWithSystem(
    systemPrompt: string,
    userPrompt: string,
    options?: GeminiChatOptions,
  ): Promise<AiChatResponse> {
    return this.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      options,
    );
  }

  async *streamChat(
    messages: GeminiChatMessage[],
    options?: GeminiChatOptions,
  ): AsyncGenerator<{ content: string; done: boolean }, void, unknown> {
    try {
      const modelName = options?.model || this.defaultModel;
      const formattedMessages = this.formatMessagesForGemini(messages);

      const stream = await this.genAI.models.generateContentStream({
        model: modelName,
        contents: formattedMessages,
        config: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxOutputTokens ?? 800,
          topP: options?.topP,
          topK: options?.topK,
          stopSequences: options?.stopSequences,
        },
      });

      for await (const chunk of stream) {
        const content = chunk.text;
        if (content) {
          yield { content, done: false };
        }
      }

      yield { content: '', done: true };
    } catch (error) {
      console.error('Gemini streaming error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Gemini streaming error: ${message}`);
    }
  }

  async *streamChatWithSystem(
    systemPrompt: string,
    userPrompt: string,
    options?: GeminiChatOptions,
  ): AsyncGenerator<{ content: string; done: boolean }, void, unknown> {
    yield* this.streamChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      options,
    );
  }
}
