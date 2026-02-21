import { Test, TestingModule } from "@nestjs/testing";
import { DataSource } from "typeorm";
import { AnalyticsService } from "./analytics.service";

describe("AnalyticsService", () => {
	let service: AnalyticsService;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let dataSource: DataSource;

	const mockDataSource = {
		query: jest.fn(),
		createQueryRunner: jest.fn().mockReturnValue({
			connect: jest.fn(),
			startTransaction: jest.fn(),
			commitTransaction: jest.fn(),
			rollbackTransaction: jest.fn(),
			release: jest.fn(),
			query: jest.fn(),
		}),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AnalyticsService,
				{
					provide: DataSource,
					useValue: mockDataSource,
				},
			],
		}).compile();

		service = module.get<AnalyticsService>(AnalyticsService);
		dataSource = module.get<DataSource>(DataSource);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
