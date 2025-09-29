import { Injectable } from '@nestjs/common';
import { Entry } from '../../entries/models/entries.model';
import { pipeline } from '@huggingface/transformers';
import { createEntryEmbeddingText } from '../../entries/utils/entryRagUtils';

@Injectable()
export class EmbeddingService {
  constructor() {}

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const embedder = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
      );

      const result = await embedder(text, {
        pooling: 'mean',
        normalize: true,
      });

      if (result && typeof result === 'object' && 'data' in result) {
        return Array.from(result.data) as number[];
      }

      throw new Error('Invalid embedding result format');
    } catch (error) {
      throw new Error(
        `Failed to generate embedding: ${(error as Error).message}`,
      );
    }
  }

  async embedEntry(entry: Entry): Promise<number[]> {
    const text = createEntryEmbeddingText(entry);
    return this.generateEmbedding(text);
  }
}
