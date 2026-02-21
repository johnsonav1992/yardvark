import { Test, TestingModule } from "@nestjs/testing";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { EntriesController } from "../controllers/entries.controller";
import { EntriesService } from "../services/entries.service";

describe("EntriesController", () => {
	let controller: EntriesController;

	const mockEntriesService = {
		getEntries: jest.fn(),
		getEntry: jest.fn(),
		createEntry: jest.fn(),
		updateEntry: jest.fn(),
		deleteEntry: jest.fn(),
		searchEntries: jest.fn(),
	};

	const mockEventEmitter = {
		emit: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [EntriesController],
			providers: [
				{
					provide: EntriesService,
					useValue: mockEntriesService,
				},
				{
					provide: EventEmitter2,
					useValue: mockEventEmitter,
				},
			],
		}).compile();

		controller = module.get<EntriesController>(EntriesController);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});
});
