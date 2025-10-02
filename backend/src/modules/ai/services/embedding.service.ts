import { Injectable, OnModuleInit } from '@nestjs/common';
import { Entry } from '../../entries/models/entries.model';
import { FeatureExtractionPipeline, pipeline } from '@huggingface/transformers';
import { createEntryEmbeddingText } from '../../entries/utils/entryRagUtils';
import { tryCatch } from '../../../utils/tryCatch';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private embedder: FeatureExtractionPipeline | null = null;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const enableEntryQuery =
      this.configService.get<string>('ENABLE_ENTRY_QUERY') === 'true';

    if (!enableEntryQuery) {
      console.log(
        'Entry query feature is disabled. Skipping embedding model initialization.',
      );
      return;
    }

    const result = await tryCatch(() =>
      pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2'),
    );

    if (!result.success) {
      throw new Error(
        `Failed to initialize embedding model: ${result.error.message}`,
      );
    }

    this.embedder = result.data;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const embedder = this.embedder;

    if (!embedder) {
      throw new Error('Embedding model not initialized');
    }

    const result = await tryCatch(() =>
      embedder(text, {
        pooling: 'mean',
        normalize: true,
      }),
    );

    if (!result.success) {
      throw new Error(`Failed to generate embedding: ${result.error.message}`);
    }

    if (
      result.data &&
      typeof result.data === 'object' &&
      'data' in result.data
    ) {
      return Array.from(result.data.data) as number[];
    }

    throw new Error('Invalid embedding result format');
  }

  async embedEntry(entry: Entry): Promise<number[]> {
    const text = createEntryEmbeddingText(entry);

    return this.generateEmbedding(text);
  }
}
