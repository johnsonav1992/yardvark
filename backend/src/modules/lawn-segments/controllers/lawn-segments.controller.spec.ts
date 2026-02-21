import { Test, TestingModule } from "@nestjs/testing";
import { LawnSegmentsController } from "./lawn-segments.controller";
import { LawnSegmentsService } from "../services/lawn-segments.service";

describe("LawnSegmentsController", () => {
	let controller: LawnSegmentsController;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let service: LawnSegmentsService;

	const mockLawnSegmentsService = {
		getLawnSegments: jest.fn(),
		createLawnSegment: jest.fn(),
		updateLawnSegment: jest.fn(),
		deleteLawnSegment: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [LawnSegmentsController],
			providers: [
				{
					provide: LawnSegmentsService,
					useValue: mockLawnSegmentsService,
				},
			],
		}).compile();

		controller = module.get<LawnSegmentsController>(LawnSegmentsController);
		service = module.get<LawnSegmentsService>(LawnSegmentsService);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});
});
