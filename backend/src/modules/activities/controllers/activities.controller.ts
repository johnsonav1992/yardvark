import { Controller, Get } from '@nestjs/common';
import { ActivitiesService } from '../services/activities.service';

@Controller('activities')
export class ActivitiesController {
  constructor(private _activitiesService: ActivitiesService) {}

  @Get()
  async getActivities() {
    return this._activitiesService.getActivities();
  }
}
