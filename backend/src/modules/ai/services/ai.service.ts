import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { EmbeddingService } from './embedding.service';
import { EntriesService } from '../../entries/services/entries.service';
import { tryCatch } from '../../../utils/tryCatch';
import { AiChatResponse } from '../../../types/ai.types';
import { Entry } from '../../entries/models/entries.model';
import { getEntryResponseMapping } from '../../entries/utils/entryUtils';

@Injectable()
export class AiService {
  constructor(
    private geminiService: GeminiService,
    private embeddingService: EmbeddingService,
    @Inject(forwardRef(() => EntriesService))
    private entriesService: EntriesService,
  ) {}

  async chat(prompt: string): Promise<AiChatResponse> {
    console.log(
      'Sending request to AI service with prompt:',
      prompt.substring(0, 100) + '...',
    );

    const result = await tryCatch(() => this.geminiService.simpleChat(prompt));

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
      this.geminiService.chatWithSystem(systemPrompt, userPrompt),
    );

    if (!result.success) {
      console.error('AI service error:', result.error);
      throw new Error(
        `Failed to generate AI response: ${result.error.message}`,
      );
    }

    return result.data;
  }

  async queryEntries(userId: string, naturalQuery: string): Promise<AiChatResponse> {
    try {
      const queryEmbedding = await this.embeddingService.generateEmbedding(naturalQuery);

      const relevantEntries = await this.entriesService.searchEntriesByVector(
        userId,
        queryEmbedding,
        8,
      );

      const context = this.buildContextFromEntries(relevantEntries);

      const systemPrompt = `You are a lawn care expert assistant. Answer the user's question based only on the provided entry data from their lawn care history. If you cannot find relevant information in the provided entries, say so clearly. Include specific dates and details when available.

Entry data from user's lawn care history:
${context}`;

      return this.geminiService.chatWithSystem(systemPrompt, naturalQuery);
    } catch (error) {
      console.error('RAG query error:', error);
      throw new Error(`Failed to process query: ${(error as Error).message}`);
    }
  }

  private buildContextFromEntries(entries: Entry[]): string {
    if (!entries || entries.length === 0) {
      return 'No relevant entries found in lawn care history.';
    }

    return entries
      .map((entry, index) => {
        const mappedEntry = getEntryResponseMapping(entry);
        const parts = [`Entry ${index + 1}:`];

        parts.push(`Date: ${mappedEntry.date}`);

        if (mappedEntry.title) {
          parts.push(`Title: ${mappedEntry.title}`);
        }

        if (mappedEntry.notes) {
          parts.push(`Notes: ${mappedEntry.notes}`);
        }

        if (mappedEntry.activities?.length > 0) {
          const activities = mappedEntry.activities.map(a => a.name).join(', ');
          parts.push(`Activities: ${activities}`);
        }

        if (mappedEntry.lawnSegments?.length > 0) {
          const segments = mappedEntry.lawnSegments.map(s => s.name).join(', ');
          parts.push(`Lawn segments: ${segments}`);
        }

        if (mappedEntry.products?.length > 0) {
          const products = mappedEntry.products
            .map(p => `${p.name} (${p.quantity} ${p.quantityUnit})`)
            .join(', ');
          parts.push(`Products used: ${products}`);
        }

        if (mappedEntry.soilTemperature) {
          parts.push(`Soil temperature: ${mappedEntry.soilTemperature}°${mappedEntry.soilTemperatureUnit}`);
        }

        return parts.join(' | ');
      })
      .join('\n\n');
  }

  async initializeEmbeddings(userId: string): Promise<{ processed: number; errors: number }> {
    const allEntriesWithoutEmbeddings = await this.entriesService.getEntriesWithoutEmbeddings(userId);

    // Limit to just 1 entry for testing
    const entriesWithoutEmbeddings = allEntriesWithoutEmbeddings.slice(0, 1);

    console.log(`Processing ${entriesWithoutEmbeddings.length} out of ${allEntriesWithoutEmbeddings.length} total entries for testing`);

    let processed = 0;
    let errors = 0;

    for (const entry of entriesWithoutEmbeddings) {
      try {
        console.log(`Processing entry ${entry.id}`);
        const embedding = await this.embeddingService.embedEntry(entry);
        console.log(`Generated embedding with ${embedding.length} dimensions`);
        await this.entriesService.updateEntryEmbedding(entry.id, embedding);
        processed++;
        console.log(`Successfully processed entry ${entry.id}`);
      } catch (error) {
        console.error(`Failed to process entry ${entry.id}:`, error);
        errors++;
      }
    }

    return { processed, errors };
  }
}
