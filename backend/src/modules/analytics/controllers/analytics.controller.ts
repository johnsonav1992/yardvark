import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { User } from "../../../decorators/user.decorator";
import { LogHelpers } from "../../../logger/logger.helpers";
import { BusinessContextKeys } from "../../../logger/logger-keys.constants";
import { resultOrThrow } from "../../../utils/resultOrThrow";
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

		if (year !== undefined && (year < 2000 || year > 2100)) {
			throw new BadRequestException("Invalid year");
		}

		return resultOrThrow(
			await this._analyticsService.getAnalytics(userId, year),
		);
	}
}
