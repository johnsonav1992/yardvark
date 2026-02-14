import { Controller, Get } from '@nestjs/common';
import { ActivitiesService } from '../services/activities.service';
import { LogHelpers } from '../../../logger/logger.helpers';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly _activitiesService: ActivitiesService) {}

  @Get()
  public async getActivities() {
    LogHelpers.addBusinessContext('controller_operation', 'get_activities');

    return this._activitiesService.getActivities();
  }
}
