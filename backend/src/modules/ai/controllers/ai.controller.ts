import {
  Body,
  Controller,
  Post,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AiService } from '../services/ai.service';
import { tryCatch } from '../../../utils/tryCatch';

export interface ChatRequest {
  prompt: string;
}

export interface ChatResponse {
  response: string;
  success: boolean;
  error?: string;
}

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Body() chatRequest: ChatRequest): Promise<ChatResponse> {
    if (!chatRequest.prompt || chatRequest.prompt.trim().length === 0) {
      throw new HttpException('Prompt is required', HttpStatus.BAD_REQUEST);
    }

    const { data, error } = await tryCatch(() =>
      this.aiService.chat(chatRequest.prompt),
    );

    if (error) {
      return {
        response: '',
        success: false,
        error: error.message || 'Failed to generate AI response',
      };
    }

    return {
      response: data || '',
      success: true,
    };
  }
}
