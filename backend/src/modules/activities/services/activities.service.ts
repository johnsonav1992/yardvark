import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Activity } from '../models/activities.model';
import type { Repository } from 'typeorm';

@Injectable()
export class ActivitiesService {
	constructor(
		@InjectRepository(Activity) private _activitiesRepo: Repository<Activity>
	) {}

	async getActivities() {
		return this._activitiesRepo.find();
	}
}
