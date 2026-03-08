import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { getYear } from "date-fns";
import { DataSource } from "typeorm";
import { LogHelpers } from "../../../logger/logger.helpers";
import { BusinessContextKeys } from "../../../logger/logger-keys.constants";
import { type Either, error, success } from "../../../types/either";
import { AnalyticsFetchError } from "../models/analytics.errors";
import type { AnalyticsRes } from "../models/analytics.types";

@Injectable()
export class AnalyticsService {
	public constructor(
		@InjectDataSource() private readonly dataSource: DataSource,
	) {}

	public async getAnalytics(
		userId: string,
		year?: number,
	): Promise<Either<AnalyticsFetchError, AnalyticsRes[0]["get_user_analytics_v2"]>> {
		const analyticsYear = year ?? getYear(new Date());

		LogHelpers.addBusinessContext(
			BusinessContextKeys.analyticsYear,
			analyticsYear,
		);

		try {
			const result = await this.dataSource.query<AnalyticsRes>(
				`SELECT * FROM get_user_analytics_v2($1, $2)`,
				[userId, analyticsYear],
			);

			return success(result[0].get_user_analytics_v2);
		} catch (err) {
			return error(new AnalyticsFetchError(err));
		}
	}
}
