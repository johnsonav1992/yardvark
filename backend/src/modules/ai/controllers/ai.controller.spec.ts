import { Test, TestingModule } from "@nestjs/testing";
import { HttpException, HttpStatus } from "@nestjs/common";
import { AiController } from "./ai.controller";
import { AiService } from "../services/ai.service";
import { success, error } from "../../../types/either";
import { AiChatError } from "../models/ai.errors";

describe("AiController", () => {
	let controller: AiController;
	let aiService: AiService;

	beforeEach(async () => {
		const mockAiService = {
			chat: jest.fn(),
			queryEntries: jest.fn(),
			initializeEmbeddings: jest.fn(),
			streamQueryEntries: jest.fn(),
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

	describe("queryEntries", () => {
		it("should return query response", async () => {
			const mockResponse = {
				content: "Query response",
				model: "gemini-2.0-flash",
				provider: "gemini" as const,
			};

			jest
				.spyOn(aiService, "queryEntries")
				.mockResolvedValue(success(mockResponse));

			const result = await controller.queryEntries("user1", {
				query: "what did I do?",
			});

			expect(result).toEqual(mockResponse);
			expect(aiService.queryEntries).toHaveBeenCalledWith(
				"user1",
				"what did I do?",
			);
		});

		it("should throw error when query is empty", async () => {
			await expect(
				controller.queryEntries("user1", { query: "" }),
			).rejects.toThrow(HttpException);
		});

		it("should use userId from body if provided", async () => {
			const mockResponse = {
				content: "Query response",
				model: "gemini-2.0-flash",
				provider: "gemini" as const,
			};

			jest
				.spyOn(aiService, "queryEntries")
				.mockResolvedValue(success(mockResponse));

			await controller.queryEntries("user1", {
				query: "test query",
				userId: "user2",
			});

			expect(aiService.queryEntries).toHaveBeenCalledWith(
				"user2",
				"test query",
			);
		});
	});

	describe("initializeEmbeddings", () => {
		it("should return initialization result", async () => {
			const mockResult = { processed: 10, errors: 0 };

			jest
				.spyOn(aiService, "initializeEmbeddings")
				.mockResolvedValue(success(mockResult));

			const result = await controller.initializeEmbeddings("user1", undefined);

			expect(result).toEqual(mockResult);
			expect(aiService.initializeEmbeddings).toHaveBeenCalledWith("user1");
		});

		it("should use userId from body if provided", async () => {
			const mockResult = { processed: 10, errors: 0 };

			jest
				.spyOn(aiService, "initializeEmbeddings")
				.mockResolvedValue(success(mockResult));

			await controller.initializeEmbeddings("user1", { userId: "user2" });

			expect(aiService.initializeEmbeddings).toHaveBeenCalledWith("user2");
		});
	});

	describe("streamQueryEntries", () => {
		it("should throw error when query is empty", async () => {
			const mockResponse = {
				setHeader: jest.fn(),
				write: jest.fn(),
				end: jest.fn(),
			};

			await expect(
				controller.streamQueryEntries("user1", mockResponse as any, {
					query: "",
				}),
			).rejects.toThrow(HttpException);
		});
	});
});
