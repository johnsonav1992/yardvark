import { Controller, Get, Query } from "@nestjs/common";
import { User } from "../../../decorators/user.decorator";
import { LogHelpers } from "../../../logger/logger.helpers";
import { BusinessContextKeys } from "../../../logger/logger-keys.constants";
import { resultOrThrow } from "../../../utils/resultOrThrow";
import { GddService } from "../services/gdd.service";

@Controller("gdd")
export class GddController {
	constructor(private readonly _gddService: GddService) {}

	@Get("current")
	public async getCurrentGdd(@User("userId") userId: string) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"get_current_gdd",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

		return resultOrThrow(await this._gddService.getCurrentGdd(userId));
	}

	@Get("historical")
	public async getHistoricalGdd(
		@User("userId") userId: string,
		@Query("startDate") startDate: string,
		@Query("endDate") endDate: string,
	) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"get_historical_gdd",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);
		LogHelpers.addBusinessContext(BusinessContextKeys.startDate, startDate);
		LogHelpers.addBusinessContext(BusinessContextKeys.endDate, endDate);

		return resultOrThrow(
			await this._gddService.getHistoricalGdd(userId, startDate, endDate),
		);
	}

	@Get("forecast")
	public async getGddForecast(@User("userId") userId: string) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"get_gdd_forecast",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

		return resultOrThrow(await this._gddService.getGddForecast(userId));
	}
}
