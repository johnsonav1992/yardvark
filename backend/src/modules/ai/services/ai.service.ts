import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { EmbeddingService } from './embedding.service';
import { EntriesService } from '../../entries/services/entries.service';
import { tryCatch } from '../../../utils/tryCatch';
import { AiChatResponse } from '../../../types/ai.types';
import {
  extractDateRange,
  preprocessQuery,
  buildContextFromEntries,
} from '../../entries/utils/entryRagUtils';

@Injectable()
export class AiService {
  constructor(
    private geminiService: GeminiService,
    private embeddingService: EmbeddingService,
    @Inject(forwardRef(() => EntriesService))
    private entriesService: EntriesService,
  ) {}

  async chat(prompt: string): Promise<AiChatResponse> {
    const result = await tryCatch(() => this.geminiService.simpleChat(prompt));

    if (!result.success) {
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
      this.geminiService.chatWithSystem(systemPrompt, userPrompt),
    );

    if (!result.success) {
      throw new Error(
        `Failed to generate AI response: ${result.error.message}`,
      );
    }

    return result.data;
  }

  async queryEntries(
    userId: string,
    naturalQuery: string,
  ): Promise<AiChatResponse> {
    try {
      const preprocessedQuery = preprocessQuery(naturalQuery);
      const queryEmbedding =
        await this.embeddingService.generateEmbedding(preprocessedQuery);
      const dateRange = extractDateRange(naturalQuery);
      const relevantEntries = await this.entriesService.searchEntriesByVector({
        userId,
        queryEmbedding,
        startDate: dateRange?.startDate,
        endDate: dateRange?.endDate,
      });
      const context = buildContextFromEntries(relevantEntries);

      const systemPrompt = `You are a lawn care expert assistant. Answer the user's question based only on the provided entry data from their lawn care history. If you cannot find relevant information in the provided entries, say so clearly. Include specific dates and details when available.

      Entry data from user's lawn care history:
      ${context}`;

      return this.geminiService.chatWithSystem(systemPrompt, naturalQuery);
    } catch (error) {
      throw new Error(`Failed to process query: ${(error as Error).message}`);
    }
  }

  async *streamQueryEntries(
    userId: string,
    naturalQuery: string,
  ): AsyncGenerator<{ content: string; done: boolean }, void, unknown> {
    try {
      const preprocessedQuery = preprocessQuery(naturalQuery);
      const queryEmbedding =
        await this.embeddingService.generateEmbedding(preprocessedQuery);
      const dateRange = extractDateRange(naturalQuery);
      const relevantEntries = await this.entriesService.searchEntriesByVector({
        userId,
        queryEmbedding,
        startDate: dateRange?.startDate,
        endDate: dateRange?.endDate,
      });
      const context = buildContextFromEntries(relevantEntries);

      const systemPrompt = `You are a lawn care expert assistant. Answer the user's question based only on the provided entry data from their lawn care history. If you cannot find relevant information in the provided entries, say so clearly. Include specific dates and details when available.

      Entry data from user's lawn care history:
      ${context}`;

      yield* this.geminiService.streamChatWithSystem(
        systemPrompt,
        naturalQuery,
      );
    } catch (error) {
      throw new Error(
        `Failed to process streaming query: ${(error as Error).message}`,
      );
    }
  }

  async initializeEmbeddings(
    userId: string,
  ): Promise<{ processed: number; errors: number }> {
    const entriesWithoutEmbeddings =
      await this.entriesService.getEntriesWithoutEmbeddings(userId);

    let processed = 0;
    let errors = 0;

    for (const entry of entriesWithoutEmbeddings) {
      try {
        const embedding = await this.embeddingService.embedEntry(entry);
        await this.entriesService.updateEntryEmbedding(entry.id, embedding);
        processed++;
      } catch {
        errors++;
      }
    }

    return { processed, errors };
  }
}
