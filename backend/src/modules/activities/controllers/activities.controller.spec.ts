import { Test, type TestingModule } from '@nestjs/testing';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from '../services/activities.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Activity } from '../models/activities.model';
import { Repository } from 'typeorm';

describe('ActivitiesController', () => {
	let controller: ActivitiesController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [ActivitiesController],
			providers: [
				ActivitiesService,
				{
					provide: getRepositoryToken(Activity),
					useClass: Repository
				}
			]
		}).compile();

		controller = module.get<ActivitiesController>(ActivitiesController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	it('should return an array of activities', async () => {
		const mockActivities: Activity[] = [
			{ entries: [], id: 1, name: 'Activity 1' },
			{ entries: [], id: 2, name: 'Activity 2' }
		];

		const activitiesService = {
			getActivities: jest.fn().mockResolvedValue(mockActivities)
		};

		controller = new ActivitiesController(
			activitiesService as unknown as ActivitiesService
		);

		const result = await controller.getActivities();

		expect(result).toBeInstanceOf(Array);
		expect(result).toHaveLength(2);
		expect(result).toEqual(mockActivities);
	});
});
