import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from '../services/analytics.service';
import { User } from '../../../decorators/user.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly _analyticsService: AnalyticsService) {}

  @Get()
  public async getAnalytics(
    @User('userId') userId: string,
    @Query('year') year?: number,
  ) {
    return this._analyticsService.getAnalytics(userId, year);
  }
}
