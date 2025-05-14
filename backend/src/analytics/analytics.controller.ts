import { Controller, Get, Param } from '@nestjs/common';
import { Public } from 'src/decorators/public.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly _analyticsService: AnalyticsService) {}

  @Public()
  @Get(':userId')
  async getAnalytics(@Param('userId') userId: string) {
    return this._analyticsService.getAnalytics(userId);
  }
}
