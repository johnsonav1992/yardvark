import { Query, Resolver } from "@nestjs/graphql";
import { Activity } from "../models/activities.model";
import { ActivitiesService } from "../services/activities.service";

@Resolver(() => Activity)
export class ActivitiesResolver {
	constructor(private readonly activitiesService: ActivitiesService) {}

	@Query(() => [Activity], { name: "activities" })
	async getActivities(): Promise<Activity[]> {
		return this.activitiesService.getActivities();
	}
}
