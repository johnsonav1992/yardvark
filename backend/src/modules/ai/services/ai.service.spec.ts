import { Test, type TestingModule } from "@nestjs/testing";
import { ResourceError } from "../../../errors/resource-error";
import { error, success } from "../../../types/either";
import { AiChatDailyLimitReachedError } from "../models/ai.errors";
import { AiService } from "./ai.service";
import { EntryQueryToolsService } from "./entry-query-tools.service";
import { GeminiService } from "./gemini.service";
import { SubscriptionService } from "../../subscription/services/subscription.service";
import { AiSessionService } from "./ai-session.service";

describe("AiService", () => {
	let service: AiService;
	let geminiService: GeminiService;
	let entryQueryToolsService: EntryQueryToolsService;
	let subscriptionService: SubscriptionService;
	let sessionService: AiSessionService;

	beforeEach(async () => {
		const mockGeminiService = {
			simpleChat: jest.fn(),
			chatWithSystem: jest.fn(),
			chatWithTools: jest.fn(),
			streamChatWithTools: jest.fn(),
		};
		const mockEntryQueryToolsService = {
			getToolDefinitions: jest.fn(),
			executeTool: jest.fn(),
			proposeEntry: jest.fn(),
		};
		const mockSubscriptionService = {
			checkFeatureAccess: jest.fn(),
			incrementUsage: jest.fn(),
			getCurrentFeatureUsage: jest.fn(),
		};
		const mockSessionService = {
			getHistory: jest.fn(),
			appendTurn: jest.fn(),
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
				{
					provide: AiSessionService,
					useValue: mockSessionService,
				},
			],
		}).compile();

		service = module.get<AiService>(AiService);
		geminiService = module.get<GeminiService>(GeminiService);
		entryQueryToolsService = module.get<EntryQueryToolsService>(
			EntryQueryToolsService,
		);
		subscriptionService = module.get<SubscriptionService>(SubscriptionService);
		sessionService = module.get<AiSessionService>(AiSessionService);
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

	describe("streamQueryEntriesWithTools", () => {
		it("should emit entry draft side events and persist final session text", async () => {
			const draft = {
				date: "2026-03-01",
				notes: "Mowed and edged.",
				activityIds: [1, 2],
				activityNames: ["Mow", "Edge"],
				lawnSegmentIds: [],
				lawnSegmentNames: [],
				products: [],
			};

			jest
				.spyOn(entryQueryToolsService, "getToolDefinitions")
				.mockReturnValue([]);
			jest.spyOn(sessionService, "getHistory").mockReturnValue([]);
			jest.spyOn(entryQueryToolsService, "proposeEntry").mockResolvedValue(
				draft,
			);
			jest.spyOn(geminiService, "streamChatWithTools").mockImplementation(
				async function* ({ toolExecutor }) {
					await toolExecutor("propose_entry", {
						date: "2026-03-01",
						activityIds: [1, 2],
					});
					yield { type: "chunk", text: "Draft ready." };
					yield { type: "done" };
				},
			);

			const events = [];
			for await (const event of service.streamQueryEntriesWithTools(
				"user-1",
				"log today's mow",
				"session-123",
			)) {
				events.push(event);
			}

			expect(events).toEqual([
				{ type: "entry_draft", data: draft },
				{ type: "chunk", text: "Draft ready." },
				{ type: "done" },
			]);
			expect(sessionService.appendTurn).toHaveBeenCalledWith(
				"session-123",
				{ role: "user", parts: [{ text: "log today's mow" }] },
				{ role: "model", parts: [{ text: "Draft ready." }] },
			);
		});
	});

	describe("getEntryQueryLimitStatus", () => {
		it("should return computed limit status", async () => {
			jest
				.spyOn(subscriptionService, "checkFeatureAccess")
				.mockResolvedValue(
					success({
						allowed: true,
						limit: 10,
						usage: 4,
					}),
				);
			jest
				.spyOn(subscriptionService, "getCurrentFeatureUsage")
				.mockResolvedValue(
					success({
						usage: 4,
						periodStart: new Date("2026-03-02T00:00:00.000Z"),
						periodEnd: new Date("2026-03-03T00:00:00.000Z"),
					}),
				);

			const result = await service.getEntryQueryLimitStatus("user-1");

			expect(result.isSuccess()).toBe(true);
			if (result.isSuccess()) {
				expect(result.value).toEqual({
					limit: 10,
					used: 4,
					remaining: 6,
					resetAt: "2026-03-03T00:00:00.000Z",
				});
			}
		});
	});

	describe("reserveEntryQueryMessage", () => {
		it("should return limit reached error when access is denied by quota", async () => {
			jest
				.spyOn(subscriptionService, "checkFeatureAccess")
				.mockResolvedValue(
					success({
						allowed: false,
						limit: 10,
						usage: 10,
					}),
				);

			const result = await service.reserveEntryQueryMessage("user-1");

			expect(result.isError()).toBe(true);
			if (result.isError()) {
				expect(result.value).toBeInstanceOf(AiChatDailyLimitReachedError);
			}
		});

		it("should increment usage and return refreshed limit status", async () => {
			jest
				.spyOn(subscriptionService, "checkFeatureAccess")
				.mockResolvedValue(
					success({
						allowed: true,
						limit: 10,
						usage: 4,
					}),
				);
			jest
				.spyOn(subscriptionService, "incrementUsage")
				.mockResolvedValue(success(undefined));
			jest
				.spyOn(subscriptionService, "getCurrentFeatureUsage")
				.mockResolvedValue(
					success({
						usage: 5,
						periodStart: new Date("2026-03-02T00:00:00.000Z"),
						periodEnd: new Date("2026-03-03T00:00:00.000Z"),
					}),
				);

			const result = await service.reserveEntryQueryMessage("user-1");

			expect(subscriptionService.incrementUsage).toHaveBeenCalled();
			expect(result.isSuccess()).toBe(true);
			if (result.isSuccess()) {
				expect(result.value.remaining).toBe(5);
			}
		});

		it("should return wrapped error when increment usage fails", async () => {
			jest
				.spyOn(subscriptionService, "checkFeatureAccess")
				.mockResolvedValue(
					success({
						allowed: true,
						limit: 10,
						usage: 4,
					}),
				);
			jest
				.spyOn(subscriptionService, "incrementUsage")
				.mockResolvedValue(
					error(
						new ResourceError({
							message: "DB down",
							code: "INCREMENT_USAGE_ERROR",
						}),
					),
				);

			const result = await service.reserveEntryQueryMessage("user-1");

			expect(result.isError()).toBe(true);
		});
	});
});
