import {
  Body,
  Controller,
  Post,
  HttpException,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AiService } from '../services/ai.service';
import { AiChatResponse, AiChatRequest } from '../../../types/ai.types';
import { FeatureFlag } from '../../../decorators/feature-flag.decorator';
import { SubscriptionFeature } from '../../../decorators/subscription-feature.decorator';
import { resultOrThrow } from '../../../utils/resultOrThrow';
import { User } from '../../../decorators/user.decorator';
import { LogHelpers } from '../../../logger/logger.helpers';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @SubscriptionFeature('ai_chat')
  public async chat(
    @Body() chatRequest: AiChatRequest,
  ): Promise<AiChatResponse> {
    LogHelpers.addBusinessContext('controller_operation', 'ai_chat');

    if (!chatRequest.prompt || chatRequest.prompt.trim().length === 0) {
      throw new HttpException('Prompt is required', HttpStatus.BAD_REQUEST);
    }

    return resultOrThrow(await this.aiService.chat(chatRequest.prompt));
  }

  @FeatureFlag('ENABLE_ENTRY_QUERY')
  @SubscriptionFeature('ai_query')
  // @Public()
  @Post('query-entries')
  public async queryEntries(
    @User('userId') userId: string,
    @Body() body: { query: string; userId?: string },
  ): Promise<AiChatResponse> {
    LogHelpers.addBusinessContext('controller_operation', 'ai_query_entries');
    LogHelpers.addBusinessContext('user_id', userId);

    if (!body.query || body.query.trim().length === 0) {
      throw new HttpException('Query is required', HttpStatus.BAD_REQUEST);
    }

    const resolvedUserId =
      body.userId || userId || 'google-oauth2|111643664660289512636';

    return resultOrThrow(
      await this.aiService.queryEntries(resolvedUserId, body.query),
    );
  }

  @FeatureFlag('ENABLE_ENTRY_QUERY')
  @SubscriptionFeature('ai_init')
  // @Public()
  @Post('initialize-embeddings')
  public async initializeEmbeddings(
    @User('userId') userId: string,
    @Body() body?: { userId?: string },
  ): Promise<{ processed: number; errors: number }> {
    LogHelpers.addBusinessContext(
      'controller_operation',
      'ai_initialize_embeddings',
    );
    LogHelpers.addBusinessContext('user_id', userId);

    const resolvedUserId =
      body?.userId || userId || 'google-oauth2|111643664660289512636';

    return resultOrThrow(
      await this.aiService.initializeEmbeddings(resolvedUserId),
    );
  }

  @FeatureFlag('ENABLE_ENTRY_QUERY')
  @SubscriptionFeature('ai_stream')
  // @Public()
  @Post('stream-query-entries')
  public async streamQueryEntries(
    @User('userId') userId: string,
    @Res() res: Response,
    @Body() body: { query: string; userId?: string },
  ): Promise<void> {
    LogHelpers.addBusinessContext('controller_operation', 'ai_stream_query');
    LogHelpers.addBusinessContext('user_id', userId);

    if (!body.query || body.query.trim().length === 0) {
      throw new HttpException('Query is required', HttpStatus.BAD_REQUEST);
    }

    const resolvedUserId = body.userId || userId;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    res.write('data: {"type":"connected"}\n\n');

    try {
      const stream = this.aiService.streamQueryEntries(
        resolvedUserId,
        body.query,
      );

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
      LogHelpers.addBusinessContext('stream_error', (error as Error).message);

      const errorData = JSON.stringify({
        type: 'error',
        message: (error as Error).message || 'Unknown error',
      });
      res.write(`data: ${errorData}\n\n`);
      res.end();
    }
  }
}
