import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Activity } from "../models/activities.model";
import { Repository } from "typeorm";
import { LogHelpers } from "../../../logger/logger.helpers";
import { BusinessContextKeys } from "../../../logger/logger-keys.constants";

@Injectable()
export class ActivitiesService {
	constructor(
		@InjectRepository(Activity)
		private readonly _activitiesRepo: Repository<Activity>,
	) {}

	public async getActivities() {
		const activities = await this._activitiesRepo.find();

		LogHelpers.addBusinessContext(
			BusinessContextKeys.activitiesCount,
			activities.length,
		);

		return activities;
	}
}
