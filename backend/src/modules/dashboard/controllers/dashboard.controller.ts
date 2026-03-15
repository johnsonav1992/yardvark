import { Controller, Get } from "@nestjs/common";
import { User } from "../../../decorators/user.decorator";
import { LogHelpers } from "../../../logger/logger.helpers";
import { BusinessContextKeys } from "../../../logger/logger-keys.constants";
import { DashboardService } from "../services/dashboard.service";

@Controller("dashboard")
export class DashboardController {
	constructor(private readonly _dashboardService: DashboardService) {}

	@Get("summary")
	public getDashboardSummary(@User("userId") userId: string) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"get_dashboard_summary",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

		return this._dashboardService.getDashboardSummary(userId);
	}
}
