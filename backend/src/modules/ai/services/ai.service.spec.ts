import { Test, type TestingModule } from "@nestjs/testing";
import { AiService } from "./ai.service";
import { EntryQueryToolsService } from "./entry-query-tools.service";
import { GeminiService } from "./gemini.service";
import { SubscriptionService } from "../../subscription/services/subscription.service";

describe("AiService", () => {
	let service: AiService;
	let geminiService: GeminiService;

	beforeEach(async () => {
		const mockGeminiService = {
			simpleChat: jest.fn(),
			chatWithSystem: jest.fn(),
		};
		const mockEntryQueryToolsService = {
			getToolDefinitions: jest.fn(),
			executeTool: jest.fn(),
		};
		const mockSubscriptionService = {
			checkFeatureAccess: jest.fn(),
			incrementUsage: jest.fn(),
			getCurrentFeatureUsage: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AiService,
				{
					provide: GeminiService,
					useValue: mockGeminiService,
				},
				{
					provide: EntryQueryToolsService,
					useValue: mockEntryQueryToolsService,
				},
				{
					provide: SubscriptionService,
					useValue: mockSubscriptionService,
				},
			],
		}).compile();

		service = module.get<AiService>(AiService);
		geminiService = module.get<GeminiService>(GeminiService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("chat", () => {
		it("should return success with chat response", async () => {
			const mockResponse = {
				content: "Test response",
				model: "gemini-2.0-flash",
				provider: "gemini" as const,
			};

			jest.spyOn(geminiService, "simpleChat").mockResolvedValue(mockResponse);

			const result = await service.chat("test prompt");

			expect(result.isSuccess()).toBe(true);

			if (result.isSuccess()) {
				expect(result.value).toEqual(mockResponse);
			}

			expect(geminiService.simpleChat).toHaveBeenCalledWith("test prompt");
		});

		it("should return error when chat fails", async () => {
			jest
				.spyOn(geminiService, "simpleChat")
				.mockRejectedValue(new Error("API error"));

			const result = await service.chat("test prompt");

			expect(result.isError()).toBe(true);
		});
	});

	describe("chatWithSystem", () => {
		it("should return success with chat response", async () => {
			const mockResponse = {
				content: "System response",
				model: "gemini-2.0-flash",
				provider: "gemini" as const,
			};

			jest
				.spyOn(geminiService, "chatWithSystem")
				.mockResolvedValue(mockResponse);

			const result = await service.chatWithSystem(
				"system prompt",
				"user prompt",
			);

			expect(result.isSuccess()).toBe(true);

			if (result.isSuccess()) {
				expect(result.value).toEqual(mockResponse);
			}

			expect(geminiService.chatWithSystem).toHaveBeenCalledWith(
				"system prompt",
				"user prompt",
			);
		});

		it("should return error when chat fails", async () => {
			jest
				.spyOn(geminiService, "chatWithSystem")
				.mockRejectedValue(new Error("API error"));

			const result = await service.chatWithSystem(
				"system prompt",
				"user prompt",
			);

			expect(result.isError()).toBe(true);
		});
	});
});
