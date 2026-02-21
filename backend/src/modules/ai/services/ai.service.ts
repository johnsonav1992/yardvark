import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { GeminiService } from "./gemini.service";
import { EmbeddingService } from "./embedding.service";
import { EntriesService } from "../../entries/services/entries.service";
import { Either, error, success } from "../../../types/either";
import { resultOrThrow } from "../../../utils/resultOrThrow";
import { AiChatResponse } from "../../../types/ai.types";
import {
	AiChatError,
	AiQueryError,
	AiEmbeddingError,
} from "../models/ai.errors";
import {
	extractDateRange,
	preprocessQuery,
	buildContextFromEntries,
} from "../../entries/utils/entryRagUtils";
import { LogHelpers } from "../../../logger/logger.helpers";
import { BusinessContextKeys } from "../../../logger/logger-keys.constants";

@Injectable()
export class AiService {
	constructor(
		private readonly geminiService: GeminiService,
		private readonly embeddingService: EmbeddingService,
		@Inject(forwardRef(() => EntriesService))
		private readonly entriesService: EntriesService,
	) {}

	public async chat(
		prompt: string,
	): Promise<Either<AiChatError, AiChatResponse>> {
		try {
			const response = await this.geminiService.simpleChat(prompt);

			return success(response);
		} catch (err) {
			return error(new AiChatError(err));
		}
	}

	public async chatWithSystem(
		systemPrompt: string,
		userPrompt: string,
	): Promise<Either<AiChatError, AiChatResponse>> {
		try {
			const response = await this.geminiService.chatWithSystem(
				systemPrompt,
				userPrompt,
			);

			return success(response);
		} catch (err) {
			return error(new AiChatError(err));
		}
	}

	public async queryEntries(
		userId: string,
		naturalQuery: string,
	): Promise<Either<AiQueryError, AiChatResponse>> {
		LogHelpers.addBusinessContext(BusinessContextKeys.aiQueryType, "rag");

		try {
			const preprocessedQuery = preprocessQuery(naturalQuery);
			const queryEmbedding =
				await this.embeddingService.generateEmbedding(preprocessedQuery);
			const dateRange = extractDateRange(naturalQuery);
			const relevantEntries = resultOrThrow(
				await this.entriesService.searchEntriesByVector({
					userId,
					queryEmbedding,
					startDate: dateRange?.startDate,
					endDate: dateRange?.endDate,
				}),
			);

			LogHelpers.addBusinessContext(
				BusinessContextKeys.ragEntriesFound,
				relevantEntries.length,
			);

			const context = buildContextFromEntries(relevantEntries);

			const systemPrompt = `You are a lawn care expert assistant. Answer the user's question based only on the provided entry data from their lawn care history. If you cannot find relevant information in the provided entries, say so clearly. Include specific dates and details when available.

      Entry data from user's lawn care history:
      ${context}`;

			const response = await this.geminiService.chatWithSystem(
				systemPrompt,
				naturalQuery,
			);

			return success(response);
		} catch (err) {
			return error(new AiQueryError(err));
		}
	}

	public async *streamQueryEntries(
		userId: string,
		naturalQuery: string,
	): AsyncGenerator<{ content: string; done: boolean }, void, unknown> {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.aiQueryType,
			"rag-stream",
		);

		try {
			const preprocessedQuery = preprocessQuery(naturalQuery);
			const queryEmbedding =
				await this.embeddingService.generateEmbedding(preprocessedQuery);
			const dateRange = extractDateRange(naturalQuery);

			const relevantEntries = resultOrThrow(
				await this.entriesService.searchEntriesByVector({
					userId,
					queryEmbedding,
					startDate: dateRange?.startDate,
					endDate: dateRange?.endDate,
				}),
			);

			LogHelpers.addBusinessContext(
				BusinessContextKeys.ragEntriesFound,
				relevantEntries.length,
			);

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

	public async initializeEmbeddings(
		userId: string,
	): Promise<Either<AiEmbeddingError, { processed: number; errors: number }>> {
		try {
			const entriesWithoutEmbeddings =
				await this.entriesService.getEntriesWithoutEmbeddings(userId);

			LogHelpers.addBusinessContext(
				BusinessContextKeys.embeddingsToProcess,
				entriesWithoutEmbeddings.length,
			);

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

			LogHelpers.addBusinessContext(
				BusinessContextKeys.embeddingsProcessed,
				processed,
			);
			LogHelpers.addBusinessContext(
				BusinessContextKeys.embeddingsErrors,
				errors,
			);

			return success({ processed, errors });
		} catch (err) {
			return error(new AiEmbeddingError(err));
		}
	}
}
