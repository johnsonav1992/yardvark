import { Controller, Get, Query } from "@nestjs/common";
import { User } from "../../../decorators/user.decorator";
import { LogHelpers } from "../../../logger/logger.helpers";
import { BusinessContextKeys } from "../../../logger/logger-keys.constants";
import { AnalyticsService } from "../services/analytics.service";

@Controller("analytics")
export class AnalyticsController {
	constructor(private readonly _analyticsService: AnalyticsService) {}

	@Get()
	public async getAnalytics(
		@User("userId") userId: string,
		@Query("year") year?: number,
	) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"get_analytics",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);
		LogHelpers.addBusinessContext(BusinessContextKeys.analyticsYear, year);

		return this._analyticsService.getAnalytics(userId, year);
	}
}
