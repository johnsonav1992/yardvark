import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from '../services/analytics.service';
import { User } from '../../../decorators/user.decorator';
import { LogHelpers } from '../../../logger/logger.helpers';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly _analyticsService: AnalyticsService) {}

  @Get()
  public async getAnalytics(
    @User('userId') userId: string,
    @Query('year') year?: number,
  ) {
    LogHelpers.addBusinessContext('controller_operation', 'get_analytics');
    LogHelpers.addBusinessContext('user_id', userId);
    LogHelpers.addBusinessContext('analytics_year', year);

    return this._analyticsService.getAnalytics(userId, year);
  }
}
