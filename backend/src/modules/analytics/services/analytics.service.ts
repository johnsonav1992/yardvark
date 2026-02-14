import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AnalyticsRes } from '../models/analytics.types';
import { LogHelpers } from '../../../logger/logger.helpers';

@Injectable()
export class AnalyticsService {
  public constructor(private readonly dataSource: DataSource) {}

  public async getAnalytics(
    userId: string,
    year?: number,
  ): Promise<AnalyticsRes[0]['get_user_analytics_v2']> {
    const analyticsYear = year ?? new Date().getFullYear();
    LogHelpers.addBusinessContext('analyticsYear', analyticsYear);

    const result = await this.dataSource.query<AnalyticsRes>(
      `SELECT * FROM get_user_analytics_v2($1, $2)`,
      [userId, analyticsYear],
    );

    return result[0].get_user_analytics_v2;
  }
}
