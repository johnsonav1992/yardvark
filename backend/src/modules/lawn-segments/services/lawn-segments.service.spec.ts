import { Test, type TestingModule } from '@nestjs/testing';
import { LawnSegmentsService } from '../services/lawn-segments.service';

describe('LawnSegmentsService', () => {
	let service: LawnSegmentsService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [LawnSegmentsService]
		}).compile();

		service = module.get<LawnSegmentsService>(LawnSegmentsService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
