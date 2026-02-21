import { Injectable } from "@nestjs/common";
import { getYear } from "date-fns";
import type { DataSource } from "typeorm";
import { LogHelpers } from "../../../logger/logger.helpers";
import { BusinessContextKeys } from "../../../logger/logger-keys.constants";
import type { AnalyticsRes } from "../models/analytics.types";

@Injectable()
export class AnalyticsService {
	public constructor(private readonly dataSource: DataSource) {}

	public async getAnalytics(
		userId: string,
		year?: number,
	): Promise<AnalyticsRes[0]["get_user_analytics_v2"]> {
		const analyticsYear = year ?? getYear(new Date());
		LogHelpers.addBusinessContext(
			BusinessContextKeys.analyticsYear,
			analyticsYear,
		);

		const result = await this.dataSource.query<AnalyticsRes>(
			`SELECT * FROM get_user_analytics_v2($1, $2)`,
			[userId, analyticsYear],
		);

		return result[0].get_user_analytics_v2;
	}
}
