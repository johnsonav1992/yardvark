import { HttpException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { error, success } from "../../../types/either";
import { AiChatError } from "../models/ai.errors";
import { AiService } from "../services/ai.service";
import { AiController } from "./ai.controller";

describe("AiController", () => {
	let controller: AiController;
	let aiService: AiService;

	beforeEach(async () => {
		const mockAiService = {
			chat: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [AiController],
			providers: [
				{
					provide: AiService,
					useValue: mockAiService,
				},
			],
		}).compile();

		controller = module.get<AiController>(AiController);
		aiService = module.get<AiService>(AiService);
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});

	describe("chat", () => {
		it("should return chat response", async () => {
			const mockResponse = {
				content: "Test response",
				model: "gemini-2.0-flash",
				provider: "gemini" as const,
			};

			jest.spyOn(aiService, "chat").mockResolvedValue(success(mockResponse));

			const result = await controller.chat({ prompt: "test prompt" });

			expect(result).toEqual(mockResponse);
			expect(aiService.chat).toHaveBeenCalledWith("test prompt");
		});

		it("should throw error when prompt is empty", async () => {
			await expect(controller.chat({ prompt: "" })).rejects.toThrow(
				HttpException,
			);

			await expect(controller.chat({ prompt: "   " })).rejects.toThrow(
				HttpException,
			);
		});

		it("should throw error when chat service fails", async () => {
			jest
				.spyOn(aiService, "chat")
				.mockResolvedValue(error(new AiChatError(new Error("API error"))));

			await expect(controller.chat({ prompt: "test" })).rejects.toThrow();
		});
	});
});
