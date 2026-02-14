import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Activity } from '../models/activities.model';
import { Repository } from 'typeorm';
import { LogHelpers } from '../../../logger/logger.helpers';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly _activitiesRepo: Repository<Activity>,
  ) {}

  public async getActivities() {
    const activities = await this._activitiesRepo.find();

    LogHelpers.addBusinessContext('activitiesCount', activities.length);

    return activities;
  }
}
