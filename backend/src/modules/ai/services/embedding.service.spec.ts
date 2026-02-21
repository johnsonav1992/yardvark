import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { EmbeddingService } from "./embedding.service";

describe("EmbeddingService", () => {
	let service: EmbeddingService;
	let configService: ConfigService;

	beforeEach(async () => {
		const mockConfigService = {
			get: jest.fn((key: string) => {
				if (key === "ENABLE_ENTRY_QUERY") return "false";

				return undefined;
			}),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				EmbeddingService,
				{
					provide: ConfigService,
					useValue: mockConfigService,
				},
			],
		}).compile();

		service = module.get<EmbeddingService>(EmbeddingService);
		configService = module.get<ConfigService>(ConfigService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("onModuleInit", () => {
		it("should skip initialization when feature is disabled", async () => {
			const consoleSpy = jest
				.spyOn(console, "log")
				.mockImplementation(() => {});

			await service.onModuleInit();

			expect(consoleSpy).toHaveBeenCalledWith(
				"Entry query feature is disabled. Skipping embedding model initialization.",
			);

			consoleSpy.mockRestore();
		});
	});

	describe("generateEmbedding", () => {
		it("should throw error when embedder is not initialized", async () => {
			await expect(service.generateEmbedding("test text")).rejects.toThrow(
				"Embedding model not initialized",
			);
		});
	});

	describe("embedEntry", () => {
		it("should throw error when embedder is not initialized", async () => {
			const mockEntry = {
				id: 1,
				userId: "user1",
				date: new Date("2024-01-01"),
				notes: "Test entry",
			};

			await expect(service.embedEntry(mockEntry as any)).rejects.toThrow(
				"Embedding model not initialized",
			);
		});
	});
});
