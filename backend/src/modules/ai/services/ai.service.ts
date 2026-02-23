import { Injectable } from "@nestjs/common";
import type { AiChatResponse } from "../../../types/ai.types";
import { type Either, error, success } from "../../../types/either";
import { AiChatError } from "../models/ai.errors";
import { GeminiService } from "./gemini.service";

@Injectable()
export class AiService {
	constructor(private readonly geminiService: GeminiService) {}

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
}
