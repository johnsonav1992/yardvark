import { HttpException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { error, success } from "../../../types/either";
import { AiChatDailyLimitReachedError, AiChatError } from "../models/ai.errors";
import { AiService } from "../services/ai.service";
import { AiController } from "./ai.controller";

describe("AiController", () => {
	let controller: AiController;
	let aiService: AiService;

	beforeEach(async () => {
		const mockAiService = {
			chat: jest.fn(),
			queryEntriesWithTools: jest.fn(),
			getEntryQueryLimitStatus: jest.fn(),
			reserveEntryQueryMessage: jest.fn(),
			streamQueryEntriesWithTools: jest.fn(),
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

	describe("getQueryEntriesLimit", () => {
		it("should return current limit status", async () => {
			const limitStatus = {
				limit: 10,
				used: 3,
				remaining: 7,
				resetAt: "2026-03-03T00:00:00.000Z",
			};

			jest
				.spyOn(aiService, "getEntryQueryLimitStatus")
				.mockResolvedValue(success(limitStatus));

			const result = await controller.getQueryEntriesLimit("user-123");

			expect(result).toEqual(limitStatus);
			expect(aiService.getEntryQueryLimitStatus).toHaveBeenCalledWith(
				"user-123",
			);
		});
	});

	describe("streamQueryEntries", () => {
		const user = {
			userId: "user-123",
			email: "test@example.com",
			name: "Test User",
			isMaster: false,
		};

		const createMockResponse = () => {
			const res = {
				status: jest.fn(),
				json: jest.fn(),
				setHeader: jest.fn(),
				flushHeaders: jest.fn(),
				write: jest.fn(),
				end: jest.fn(),
			};

			res.status.mockReturnValue(res);
			return res;
		};

		it("should return 400 when query is missing", async () => {
			const res = createMockResponse();

			await controller.streamQueryEntries(user, { query: "   " }, res as never);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				message: "Query is required",
				code: "AI_CHAT_VALIDATION_ERROR",
			});
			expect(aiService.reserveEntryQueryMessage).not.toHaveBeenCalled();
		});

		it("should return subscription limit error for non-master users", async () => {
			const res = createMockResponse();
			jest
				.spyOn(aiService, "reserveEntryQueryMessage")
				.mockResolvedValue(error(new AiChatDailyLimitReachedError(10, 10)));

			await controller.streamQueryEntries(
				user,
				{ query: "When did I last mow?" },
				res as never,
			);

			expect(res.status).toHaveBeenCalledWith(402);
			expect(res.json).toHaveBeenCalledWith({
				message: "Daily AI message limit reached (10/10). Try again tomorrow.",
				code: "AI_CHAT_DAILY_LIMIT_REACHED",
			});
		});

		it("should stream limit + model events and close response", async () => {
			const res = createMockResponse();
			const limitStatus = {
				limit: 10,
				used: 4,
				remaining: 6,
				resetAt: "2026-03-03T00:00:00.000Z",
			};

			jest
				.spyOn(aiService, "reserveEntryQueryMessage")
				.mockResolvedValue(success(limitStatus));
			jest
				.spyOn(aiService, "streamQueryEntriesWithTools")
				.mockImplementation(async function* () {
					yield { type: "status", message: "Searching entries..." };
					yield { type: "chunk", text: "You last mowed on Feb 28." };
					yield { type: "done" };
				});

			await controller.streamQueryEntries(
				user,
				{ query: "When did I last mow?", sessionId: "session-1" },
				res as never,
			);

			expect(res.setHeader).toHaveBeenCalledWith(
				"Content-Type",
				"text/event-stream",
			);
			expect(res.flushHeaders).toHaveBeenCalled();
			expect(aiService.streamQueryEntriesWithTools).toHaveBeenCalledWith(
				"user-123",
				"When did I last mow?",
				"session-1",
			);
			expect(res.write).toHaveBeenCalledTimes(4);
			expect(res.end).toHaveBeenCalledTimes(1);

			const [firstWrite] = res.write.mock.calls[0] as [string];
			expect(firstWrite).toContain('"type":"limit"');
			expect(firstWrite).toContain('"remaining":6');
		});
	});
});
