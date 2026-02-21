import {
	type FeatureExtractionPipeline,
	pipeline,
} from "@huggingface/transformers";
import { Injectable, type OnModuleInit } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { LogHelpers } from "../../../logger/logger.helpers";
import type { Entry } from "../../entries/models/entries.model";
import { createEntryEmbeddingText } from "../../entries/utils/entryRagUtils";

@Injectable()
export class EmbeddingService implements OnModuleInit {
	private embedder: FeatureExtractionPipeline | null = null;

	constructor(private readonly configService: ConfigService) {}

	public async onModuleInit() {
		const enableEntryQuery =
			this.configService.get<string>("ENABLE_ENTRY_QUERY") === "true";

		if (!enableEntryQuery) {
			console.log(
				"Entry query feature is disabled. Skipping embedding model initialization.",
			);
			return;
		}

		try {
			this.embedder = await pipeline(
				"feature-extraction",
				"Xenova/all-MiniLM-L6-v2",
			);
		} catch (err) {
			throw new Error(
				`Failed to initialize embedding model: ${(err as Error).message}`,
			);
		}
	}

	public async generateEmbedding(text: string): Promise<number[]> {
		const embedder = this.embedder;

		if (!embedder) {
			throw new Error("Embedding model not initialized");
		}

		const start = Date.now();

		try {
			const result = await embedder(text, {
				pooling: "mean",
				normalize: true,
			});

			LogHelpers.recordExternalCall(
				"embedding-model",
				Date.now() - start,
				true,
			);

			if (result && typeof result === "object" && "data" in result) {
				return Array.from(result.data) as number[];
			}

			throw new Error("Invalid embedding result format");
		} catch (err) {
			LogHelpers.recordExternalCall(
				"embedding-model",
				Date.now() - start,
				false,
			);

			throw new Error(
				`Failed to generate embedding: ${(err as Error).message}`,
			);
		}
	}

	public async embedEntry(entry: Entry): Promise<number[]> {
		const text = createEntryEmbeddingText(entry);

		return this.generateEmbedding(text);
	}
}
