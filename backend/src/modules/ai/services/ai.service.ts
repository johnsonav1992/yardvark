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

  async queryEntries(
    userId: string,
    naturalQuery: string,
  ): Promise<AiChatResponse> {
    try {
      const preprocessedQuery = this.preprocessQuery(naturalQuery);
      const queryEmbedding =
        await this.embeddingService.generateEmbedding(preprocessedQuery);

      const dateRange = this.extractDateRange(naturalQuery);
      console.log('Detected date range:', dateRange);

      const relevantEntries = await this.entriesService.searchEntriesByVector({
        userId,
        queryEmbedding,
        startDate: dateRange?.startDate,
        endDate: dateRange?.endDate,
      });

      console.log(relevantEntries.length);

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

  private extractDateRange(
    query: string,
  ): { startDate: string; endDate: string } | null {
    const lowerQuery = query.toLowerCase();
    const currentYear = new Date().getFullYear();

    const monthMap = {
      january: 0,
      jan: 0,
      february: 1,
      feb: 1,
      march: 2,
      mar: 2,
      april: 3,
      apr: 3,
      may: 4,
      june: 5,
      jun: 5,
      july: 6,
      jul: 6,
      august: 7,
      aug: 7,
      september: 8,
      sep: 8,
      october: 9,
      oct: 9,
      november: 10,
      nov: 10,
      december: 11,
      dec: 11,
    };

    const createRange = (year: number, month: number) => ({
      startDate: new Date(year, month, 1).toISOString().split('T')[0],
      endDate: new Date(year, month + 1, 0).toISOString().split('T')[0],
    });

    // "May 2024" or "march 2023"
    const monthYearMatch = lowerQuery.match(
      /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})/,
    );
    if (monthYearMatch) {
      const monthNum = monthMap[monthYearMatch[1] as keyof typeof monthMap];
      if (monthNum !== undefined) {
        return createRange(parseInt(monthYearMatch[2]), monthNum);
      }
    }

    // "in May", "during March" (assume current year)
    const monthOnlyMatch = lowerQuery.match(
      /(?:in|during)\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/,
    );
    if (monthOnlyMatch) {
      const monthNum = monthMap[monthOnlyMatch[1] as keyof typeof monthMap];
      if (monthNum !== undefined) {
        return createRange(currentYear, monthNum);
      }
    }

    // "2024", "in 2023"
    const yearMatch = lowerQuery.match(/\b(?:in\s+)?(\d{4})\b/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      return {
        startDate: new Date(year, 0, 1).toISOString().split('T')[0],
        endDate: new Date(year, 11, 31).toISOString().split('T')[0],
      };
    }

    return null;
  }

  private preprocessQuery(query: string): string {
    let processedQuery = query.toLowerCase();

    // Enhance counting queries
    processedQuery = processedQuery.replace(/\bhow many times\b/gi, 'frequency count of');
    processedQuery = processedQuery.replace(/\bdid i\b/gi, 'performed');
    processedQuery = processedQuery.replace(/\bcount\b/gi, 'number of times');

    // Add semantic context for activities
    if (/\bmow|cut|cutting\b/i.test(processedQuery)) {
      processedQuery += ' lawn cutting grass maintenance mowing';
    }

    if (/\bfertiliz|feed\b/i.test(processedQuery)) {
      processedQuery += ' fertilizing nutrient application lawn feeding';
    }

    if (/\bwater|irrigat\b/i.test(processedQuery)) {
      processedQuery += ' watering irrigation lawn hydration';
    }

    // Add temporal context
    const monthMatch = processedQuery.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i);
    if (monthMatch) {
      const month = monthMatch[1].toLowerCase();
      const season = this.getMonthSeason(month);
      processedQuery += ` ${month} ${season} seasonal lawn care`;
    }

    return processedQuery;
  }

  private getMonthSeason(month: string): string {
    const seasonMap: { [key: string]: string } = {
      december: 'winter', january: 'winter', february: 'winter',
      march: 'spring', april: 'spring', may: 'spring',
      june: 'summer', july: 'summer', august: 'summer',
      september: 'fall', october: 'fall', november: 'fall',
    };
    return seasonMap[month.toLowerCase()] || '';
  }

  private buildContextFromEntries(entries: Entry[]): string {
    if (!entries || entries.length === 0) {
      return 'No relevant entries found in lawn care history.';
    }

    return entries
      .map((entry, index) => {
        const mappedEntry = getEntryResponseMapping(entry);
        const parts = [`Entry ${index + 1}:`];

        parts.push(`Date: ${mappedEntry.date.toString()}`);

        if (mappedEntry.title) {
          parts.push(`Title: ${mappedEntry.title}`);
        }

        if (mappedEntry.notes) {
          parts.push(`Notes: ${mappedEntry.notes}`);
        }

        if (mappedEntry.activities?.length > 0) {
          const activities = mappedEntry.activities
            .map((a) => a.name)
            .join(', ');
          parts.push(`Activities: ${activities}`);
        }

        if (mappedEntry.lawnSegments?.length > 0) {
          const segments = mappedEntry.lawnSegments
            .map((s) => s.name)
            .join(', ');
          parts.push(`Lawn segments: ${segments}`);
        }

        if (mappedEntry.products?.length > 0) {
          const products = mappedEntry.products
            .map(
              (p) =>
                `${p.category}: ${p.name} (${p.quantity} ${p.quantityUnit})`,
            )
            .join(', ');
          parts.push(`Products used: ${products}`);
        }

        if (mappedEntry.soilTemperature) {
          parts.push(
            `Soil temperature: ${mappedEntry.soilTemperature}°${mappedEntry.soilTemperatureUnit}`,
          );
        }

        return parts.join(' | ');
      })
      .join('\n\n');
  }

  async initializeEmbeddings(
    userId: string,
  ): Promise<{ processed: number; errors: number }> {
    const allEntriesWithoutEmbeddings =
      await this.entriesService.getEntriesWithoutEmbeddings(userId);

    const entriesWithoutEmbeddings = allEntriesWithoutEmbeddings;

    console.log(
      `Processing ${entriesWithoutEmbeddings.length} out of ${allEntriesWithoutEmbeddings.length} total entries for testing`,
    );

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
