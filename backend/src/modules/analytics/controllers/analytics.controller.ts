import { Controller, Get, Query, Req } from '@nestjs/common';
import { AnalyticsService } from '../services/analytics.service';
import { Request } from 'express';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly _analyticsService: AnalyticsService) {}

  @Get()
  async getAnalytics(@Req() req: Request, @Query('year') year?: number) {
    const userId = req.user.userId;

    return this._analyticsService.getAnalytics(userId, year);
  }
}
