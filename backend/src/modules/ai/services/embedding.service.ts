import { Injectable } from '@nestjs/common';
import { Entry } from '../../entries/models/entries.model';
import { pipeline } from '@huggingface/transformers';

@Injectable()
export class EmbeddingService {
  constructor() {}

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      console.log('Generating embedding for text:', text.substring(0, 100));

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

    // Enhanced temporal representation
    if (entry.date) {
      const date = new Date(entry.date);
      const monthName = date.toLocaleString('default', { month: 'long' });
      const year = date.getFullYear();
      parts.push(`Date: ${entry.date.toISOString().split('T')[0]}`);
      parts.push(`Month: ${monthName}`);
      parts.push(`Year: ${year}`);
      parts.push(`Season: ${this.getSeason(date)}`);
    }

    // Activity-focused representation with synonyms
    if (entry.activities?.length > 0) {
      const activities = entry.activities.map((a) => a.name).join(', ');
      parts.push(`Lawn care activities performed: ${activities}`);

      // Add activity synonyms for better matching
      const synonyms = this.getActivitySynonyms(entry.activities);
      if (synonyms.length > 0) {
        parts.push(`Related lawn care tasks: ${synonyms.join(', ')}`);
      }
    }

    // Enhanced product representation
    if (entry.entryProducts?.length > 0) {
      const products = entry.entryProducts
        .map((ep) => {
          if (!ep.product) return '';
          return `Applied ${ep.product.category.toLowerCase()}: ${ep.product.name} at ${ep.productQuantity} ${ep.productQuantityUnit}`;
        })
        .filter(Boolean);
      if (products.length > 0) {
        parts.push(products.join('. '));
      }
    }

    // Contextual information
    if (entry.title) {
      parts.push(`Task description: ${entry.title}`);
    }

    if (entry.notes) {
      parts.push(`Additional details: ${entry.notes}`);
    }

    if (entry.lawnSegments?.length > 0) {
      const segments = entry.lawnSegments.map((s) => s.name).join(', ');
      parts.push(`Areas of lawn treated: ${segments}`);
    }

    if (entry.soilTemperature) {
      parts.push(
        `Soil temperature recorded: ${entry.soilTemperature}°${entry.soilTemperatureUnit}`,
      );
    }

    return parts.join('. ');
  }

  private getSeason(date: Date): string {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private getActivitySynonyms(activities: any[]): string[] {
    const synonymMap: { [key: string]: string[] } = {
      mow: [
        'cutting grass',
        'lawn cutting',
        'grass maintenance',
        'mowing',
        'trim',
        'trimming',
      ],
      fertilize: [
        'feeding lawn',
        'nutrient application',
        'lawn feeding',
        'fertilizing',
        'fertilizer',
      ],
      water: [
        'irrigation',
        'lawn hydration',
        'grass watering',
        'watering',
        'sprinkler',
      ],
      weed: ['weed control', 'herbicide application', 'weeding', 'weed killer'],
      seed: ['seeding', 'overseeding', 'grass seeding', 'lawn seeding'],
      aerate: ['aerating', 'aeration', 'lawn aeration', 'core aeration'],
    };

    return activities.flatMap((a) => {
      const activityName = a.name.toLowerCase();
      // Find synonyms by partial matching
      for (const [key, synonyms] of Object.entries(synonymMap)) {
        if (activityName.includes(key) || key.includes(activityName)) {
          return synonyms;
        }
      }
      return [];
    });
  }
}
