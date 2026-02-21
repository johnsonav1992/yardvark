import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { GeminiService } from "./gemini.service";

describe("GeminiService", () => {
	let service: GeminiService;
	let configService: ConfigService;

	beforeEach(async () => {
		const mockConfigService = {
			get: jest.fn((key: string) => {
				if (key === "GEMINI_API_KEY") return "test-api-key";

				if (key === "GEMINI_DEFAULT_MODEL") return "gemini-2.0-flash";

				return undefined;
			}),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				GeminiService,
				{
					provide: ConfigService,
					useValue: mockConfigService,
				},
			],
		}).compile();

		service = module.get<GeminiService>(GeminiService);
		configService = module.get<ConfigService>(ConfigService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	it("should throw error when API key is not configured", () => {
		const mockConfigServiceNoKey = {
			get: jest.fn(() => undefined),
		};

		expect(() => {
			new GeminiService(mockConfigServiceNoKey as any);
		}).toThrow("GEMINI_API_KEY is required");
	});

	it("should have genAIInstance getter", () => {
		const genAI = service.genAIInstance;

		expect(genAI).toBeDefined();
	});
});
