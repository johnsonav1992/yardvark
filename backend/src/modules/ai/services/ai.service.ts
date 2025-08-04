import { Injectable } from '@nestjs/common';
import { GroqService } from './groq.service';
import { tryCatch } from '../../../utils/tryCatch';
import { AiChatResponse } from '../../../types/ai.types';

@Injectable()
export class AiService {
  constructor(private groqService: GroqService) {}

  async chat(prompt: string): Promise<AiChatResponse> {
    console.log(
      'Sending request to AI service with prompt:',
      prompt.substring(0, 100) + '...',
    );

    const result = await tryCatch(() => this.groqService.simpleChat(prompt));

    if (!result.success) {
      console.error('AI service error:', result.error);
      throw new Error(
        `Failed to generate AI response: ${result.error.message}`,
      );
    }

    return result.data;
  }

  async chatWithSystem(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<AiChatResponse> {
    const result = await tryCatch(() =>
      this.groqService.chatWithSystem(systemPrompt, userPrompt),
    );

    if (!result.success) {
      console.error('AI service error:', result.error);
      throw new Error(
        `Failed to generate AI response: ${result.error.message}`,
      );
    }

    return result.data;
  }
}
