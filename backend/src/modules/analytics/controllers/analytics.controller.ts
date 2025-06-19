import { Controller, Get, Req } from '@nestjs/common';
import type { AnalyticsService } from '../services/analytics.service';
import type { Request } from 'express';

@Controller('analytics')
export class AnalyticsController {
	constructor(private readonly _analyticsService: AnalyticsService) {}

	@Get()
	async getAnalytics(@Req() req: Request) {
		const userId = req.user.userId;

		return this._analyticsService.getAnalytics(userId);
	}
}
