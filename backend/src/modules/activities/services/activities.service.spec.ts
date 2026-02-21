import { Test, TestingModule } from "@nestjs/testing";
import { ActivitiesService } from "./activities.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Activity } from "../models/activities.model";
import { Repository } from "typeorm";

describe("ActivitiesService", () => {
	let service: ActivitiesService;

	let activityRepository: Repository<Activity>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ActivitiesService,
				{
					provide: getRepositoryToken(Activity),
					useClass: Repository,
				},
			],
		}).compile();

		service = module.get<ActivitiesService>(ActivitiesService);
		activityRepository = module.get<Repository<Activity>>(
			getRepositoryToken(Activity),
		);
	});

	it("should return an array of activities", async () => {
		const mockActivities: Activity[] = [
			{ entries: [], id: 1, name: "Activity 1" },
			{ entries: [], id: 2, name: "Activity 2" },
		];

		jest.spyOn(activityRepository, "find").mockResolvedValue(mockActivities);

		const result = await service.getActivities();

		expect(result).toBeInstanceOf(Array);
		expect(result).toHaveLength(2);
		expect(result).toEqual(mockActivities);
	});
});
