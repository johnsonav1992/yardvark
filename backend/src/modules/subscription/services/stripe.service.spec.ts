import { ConfigService } from "@nestjs/config";
import { Test, type TestingModule } from "@nestjs/testing";
import { StripeService } from "./stripe.service";

describe("StripeService", () => {
	let service: StripeService;
	let _configService: ConfigService;

	beforeEach(async () => {
		const mockConfigService = {
			get: jest.fn((key: string) => {
				if (key === "STRIPE_SECRET_KEY") return "sk_test_123";

				if (key === "STRIPE_WEBHOOK_SECRET") return "whsec_test_123";

				return undefined;
			}),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				StripeService,
				{
					provide: ConfigService,
					useValue: mockConfigService,
				},
			],
		}).compile();

		service = module.get<StripeService>(StripeService);
		_configService = module.get<ConfigService>(ConfigService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	it("should throw error when secret key is not configured", () => {
		const mockConfigServiceNoKey = {
			get: jest.fn(() => undefined),
		};

		expect(() => {
			new StripeService(mockConfigServiceNoKey as any);
		}).toThrow("STRIPE_SECRET_KEY is not configured");
	});

	it("should have getStripe method", () => {
		const stripe = service.getStripe();

		expect(stripe).toBeDefined();
	});

	describe("constructWebhookEvent", () => {
		it("should throw error when webhook secret is not configured", () => {
			const mockConfigServiceNoSecret = {
				get: jest.fn((key: string) => {
					if (key === "STRIPE_SECRET_KEY") return "sk_test_123";

					return undefined;
				}),
			};

			const serviceWithoutSecret = new StripeService(
				mockConfigServiceNoSecret as any,
			);

			expect(() => {
				serviceWithoutSecret.constructWebhookEvent(
					Buffer.from("test"),
					"test-signature",
				);
			}).toThrow("STRIPE_WEBHOOK_SECRET is not configured");
		});
	});
});
