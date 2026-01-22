import { Controller, Get } from '@nestjs/common';
import { ActivitiesService } from '../services/activities.service';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly _activitiesService: ActivitiesService) {}

  @Get()
  public async getActivities() {
    return this._activitiesService.getActivities();
  }
}
