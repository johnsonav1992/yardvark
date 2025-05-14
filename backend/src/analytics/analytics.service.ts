import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AnalyticsService {
  public constructor(private readonly dataSource: DataSource) {}

  async getAnalytics(userId: string) {
    const result = await this.dataSource.query<Record<string, any>[]>(
      `SELECT * FROM get_user_analytics($1)`,
      [userId],
    );

    return result;
  }
}
