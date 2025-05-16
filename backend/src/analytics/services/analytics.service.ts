import { Injectable } from '@nestjs/common';
import { camelizeKeys } from 'src/entries/utils/generalUtils';
import { DataSource } from 'typeorm';
import {
  MowingAnalyticsRes,
  MowingAnalyticsRowRes,
} from '../models/analytics.types';

@Injectable()
export class AnalyticsService {
  public constructor(private readonly dataSource: DataSource) {}

  async getAnalytics(userId: string): Promise<MowingAnalyticsRes> {
    const result = await this.dataSource.query<MowingAnalyticsRowRes[]>(
      `SELECT * FROM get_user_analytics($1)`,
      [userId],
    );

    const mowingAnalyticsData = camelizeKeys(result);

    return {
      mowingAnalyticsData,
    };
  }
}
