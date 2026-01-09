import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
} from 'groq-sdk/resources/chat/completions';
import { AiChatResponse } from '../../../types/ai.types';
import { LogHelpers } from '../../../logger/logger.helpers';

@Injectable()
export class GroqService {
  private readonly groq: Groq;
  private readonly defaultModel: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');

    if (!apiKey) {
      throw new Error('GROQ_API_KEY is required');
    }

    this.groq = new Groq({ apiKey: apiKey });

    this.defaultModel =
      this.configService.get<string>('GROQ_DEFAULT_MODEL') || 'llama3-8b-8192';
  }

  async chat(
    messages: ChatCompletionMessageParam[],
    options?: Partial<ChatCompletionCreateParamsNonStreaming>,
  ): Promise<AiChatResponse> {
    const modelName = options?.model || this.defaultModel;
    LogHelpers.addBusinessContext('aiModel', modelName);
    LogHelpers.addBusinessContext('aiProvider', 'groq');

    const start = Date.now();
    let success = true;

    try {
      const params: ChatCompletionCreateParamsNonStreaming = {
        messages,
        model: modelName,
        max_completion_tokens: options?.max_completion_tokens || 150,
        temperature: options?.temperature || 0.7,
        ...(options?.top_p !== undefined && { top_p: options.top_p }),
        ...(options?.stop !== undefined && { stop: options.stop }),
      };

      const chatCompletion = await this.groq.chat.completions.create(params);

      const content = chatCompletion.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content in Groq response');
      }

      // Clean up the response (remove quotes, trim whitespace)
      const cleanContent = content.replace(/^["']|["']$/g, '').trim();

      LogHelpers.addBusinessContext(
        'aiTokensUsed',
        chatCompletion.usage?.total_tokens,
      );

      return {
        content: cleanContent,
        model: params.model,
        provider: 'groq',
        usage: {
          promptTokens: chatCompletion.usage?.prompt_tokens,
          completionTokens: chatCompletion.usage?.completion_tokens,
          totalTokens: chatCompletion.usage?.total_tokens,
        },
        metadata: {
          temperature: params.temperature || undefined,
          maxTokens: params.max_completion_tokens || undefined,
          finishReason: chatCompletion.choices[0]?.finish_reason,
        },
      };
    } catch (error) {
      success = false;

      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status;
        LogHelpers.addBusinessContext('aiErrorStatus', status);

        if (status === 429) {
          LogHelpers.addBusinessContext('aiRateLimited', true);
          throw new Error('Rate limit exceeded - please try again later');
        } else if (status === 401) {
          throw new Error('Invalid Groq API key');
        } else if (status >= 500) {
          throw new Error('Groq server error - please try again later');
        }
      }

      const message = error instanceof Error ? error.message : 'Unknown error';

      throw new Error(`Groq API error: ${message}`);
    } finally {
      LogHelpers.recordExternalCall('groq', Date.now() - start, success);
    }
  }

  async simpleChat(
    prompt: string,
    options?: Partial<ChatCompletionCreateParamsNonStreaming>,
  ): Promise<AiChatResponse> {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  async chatWithSystem(
    systemPrompt: string,
    userPrompt: string,
    options?: Partial<ChatCompletionCreateParamsNonStreaming>,
  ): Promise<AiChatResponse> {
    return this.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      options,
    );
  }
}
