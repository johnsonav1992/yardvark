import {
  Body,
  Controller,
  Post,
  HttpException,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { AiService } from '../services/ai.service';
import { tryCatch } from '../../../utils/tryCatch';
import { AiChatResponse, AiChatRequest } from '../../../types/ai.types';
import { Request } from 'express';
import { Public } from '../../../decorators/public.decorator';

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

  @Public()
  @Post('query-entries')
  async queryEntries(
    @Req() req: Request,
    @Body() body: { query: string; userId?: string },
  ): Promise<AiChatResponse> {
    if (!body.query || body.query.trim().length === 0) {
      throw new HttpException('Query is required', HttpStatus.BAD_REQUEST);
    }

    const userId =
      body.userId || req.user?.userId || 'google-oauth2|111643664660289512636';
    const result = await tryCatch(() =>
      this.aiService.queryEntries(userId, body.query),
    );

    if (!result.success) {
      throw new HttpException(
        result.error.message || 'Failed to process entry query',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return result.data;
  }

  @Public()
  @Post('initialize-embeddings')
  async initializeEmbeddings(
    @Req() req: Request,
    @Body() body?: { userId?: string },
  ): Promise<{ processed: number; errors: number }> {
    const userId =
      body?.userId || req.user?.userId || 'google-oauth2|111643664660289512636';
    const result = await tryCatch(() =>
      this.aiService.initializeEmbeddings(userId),
    );

    if (!result.success) {
      throw new HttpException(
        result.error.message || 'Failed to initialize embeddings',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return result.data;
  }
}
