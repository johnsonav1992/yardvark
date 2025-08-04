import {
  Body,
  Controller,
  Post,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AiService } from '../services/ai.service';
import { tryCatch } from '../../../utils/tryCatch';
import { AiChatResponse, AiChatRequest } from '../../../types/ai.types';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Body() chatRequest: AiChatRequest): Promise<AiChatResponse> {
    if (!chatRequest.prompt || chatRequest.prompt.trim().length === 0) {
      throw new HttpException('Prompt is required', HttpStatus.BAD_REQUEST);
    }

    const result = await tryCatch(() =>
      this.aiService.chat(chatRequest.prompt),
    );

    if (!result.success) {
      throw new HttpException(
        result.error.message || 'Failed to generate AI response',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return result.data;
  }
}
