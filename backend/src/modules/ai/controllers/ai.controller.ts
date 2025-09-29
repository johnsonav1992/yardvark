import {
  Body,
  Controller,
  Post,
  HttpException,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
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

  @Public()
  @Post('stream-query-entries')
  async streamQueryEntries(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: { query: string; userId?: string },
  ): Promise<void> {
    if (!body.query || body.query.trim().length === 0) {
      throw new HttpException('Query is required', HttpStatus.BAD_REQUEST);
    }

    const userId = body.userId || req.user?.userId;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    res.write('data: {"type":"connected"}\n\n');

    try {
      const stream = this.aiService.streamQueryEntries(userId, body.query);

      for await (const chunk of stream) {
        if (chunk.content) {
          const data = JSON.stringify({
            type: 'chunk',
            content: chunk.content,
            done: chunk.done,
          });

          res.write(`data: ${data}\n\n`);
        }
        if (chunk.done) {
          res.write('data: {"type":"done"}\n\n');
          break;
        }
      }

      res.end();
    } catch (error) {
      const errorData = JSON.stringify({
        type: 'error',
        message: (error as Error).message || 'Unknown error',
      });
      res.write(`data: ${errorData}\n\n`);
      res.end();
    }
  }
}
