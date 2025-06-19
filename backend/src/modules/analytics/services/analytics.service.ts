import { Injectable } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import type { AnalyticsRes } from '../models/analytics.types';

@Injectable()
export class AnalyticsService {
	public constructor(private readonly dataSource: DataSource) {}

	async getAnalytics(
		userId: string
	): Promise<AnalyticsRes[0]['get_user_analytics_v2']> {
		const result = await this.dataSource.query<AnalyticsRes>(
			`SELECT * FROM get_user_analytics_v2($1)`,
			[userId]
		);

		return result[0].get_user_analytics_v2;
	}
}
