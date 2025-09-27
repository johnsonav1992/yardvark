import { Injectable } from '@nestjs/common';
import { Entry } from '../../entries/models/entries.model';
import { FeatureExtractionPipeline, pipeline } from '@huggingface/transformers';

@Injectable()
export class EmbeddingService {
  private embedder: FeatureExtractionPipeline | null = null;

  constructor() {}

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      console.log('Generating embedding for text:', text.substring(0, 100));

      if (!this.embedder) {
        this.embedder = (await pipeline(
          'feature-extraction',
          'Xenova/all-MiniLM-L6-v2',
        )) as unknown as FeatureExtractionPipeline;
      }

      if (!this.embedder) {
        throw new Error('Embedder not initialized');
      }

      const result = await this.embedder(text, {
        pooling: 'mean',
        normalize: true,
      });

      if (result && typeof result === 'object' && 'data' in result) {
        return Array.from(result.data);
      }

      throw new Error('Invalid embedding result format');
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(
        `Failed to generate embedding: ${(error as Error).message}`,
      );
    }
  }

  async embedEntry(entry: Entry): Promise<number[]> {
    const text = this.createEmbeddingText(entry);
    return this.generateEmbedding(text);
  }

  private createEmbeddingText(entry: Entry): string {
    const parts: string[] = [];

    if (entry.date) {
      parts.push(`Date: ${entry.date.toISOString().split('T')[0]}`);
    }

    if (entry.title) {
      parts.push(`Title: ${entry.title}`);
    }

    if (entry.notes) {
      parts.push(`Notes: ${entry.notes}`);
    }

    if (entry.activities?.length > 0) {
      const activities = entry.activities.map((a) => a.name).join(', ');
      parts.push(`Activities: ${activities}`);
    }

    if (entry.lawnSegments?.length > 0) {
      const segments = entry.lawnSegments.map((s) => s.name).join(', ');
      parts.push(`Lawn segments: ${segments}`);
    }

    if (entry.entryProducts?.length > 0) {
      const products = entry.entryProducts
        .map((ep) => {
          if (!ep.product) return '';
          const productInfo = `${ep.product.name} (${ep.productQuantity} ${ep.productQuantityUnit})`;
          const category = ep.product.category;
          return `${category}: ${productInfo}`;
        })
        .filter(Boolean)
        .join(', ');
      if (products) {
        parts.push(`Products used: ${products}`);
      }
    }

    if (entry.soilTemperature) {
      parts.push(
        `Soil temperature: ${entry.soilTemperature}°${entry.soilTemperatureUnit}`,
      );
    }

    return parts.join('. ');
  }

  async batchGenerateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    const batchSize = 10;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await Promise.all(
        batch.map((text) => this.generateEmbedding(text)),
      );
      embeddings.push(...batchEmbeddings);
    }

    return embeddings;
  }

  vectorToString(vector: number[]): string {
    return `[${vector.join(',')}]`;
  }

  stringToVector(vectorString: string): number[] {
    try {
      return JSON.parse(vectorString) as number[];
    } catch {
      return vectorString
        .slice(1, -1)
        .split(',')
        .map((n) => parseFloat(n.trim()));
    }
  }
}
