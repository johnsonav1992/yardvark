import { Test, TestingModule } from "@nestjs/testing";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "../services/analytics.service";

describe("AnalyticsController", () => {
	let controller: AnalyticsController;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let service: AnalyticsService;

	const mockAnalyticsService = {
		getTopActivities: jest.fn(),
		getYearlyTrends: jest.fn(),
		getMonthlyStats: jest.fn(),
		getActivityBreakdown: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AnalyticsController],
			providers: [
				{
					provide: AnalyticsService,
					useValue: mockAnalyticsService,
				},
			],
		}).compile();

		controller = module.get<AnalyticsController>(AnalyticsController);
		service = module.get<AnalyticsService>(AnalyticsService);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});
});
