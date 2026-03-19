import { Injectable } from "@nestjs/common";
import { EntriesService } from "../../entries/services/entries.service";
import type { DashboardSummaryResponse } from "../models/dashboard.types";

@Injectable()
export class DashboardService {
	constructor(private readonly _entriesService: EntriesService) {}

	public async getDashboardSummary(
		userId: string,
	): Promise<DashboardSummaryResponse> {
		const [recentEntry, lastMowDate, lastProductAppDate] = await Promise.all([
			this._entriesService.getMostRecentEntry(userId),
			this._entriesService.getLastMowDate(userId),
			this._entriesService.getLastProductApplicationDate(userId),
		]);

		return {
			recentEntry:
				(recentEntry as DashboardSummaryResponse["recentEntry"]) ?? null,
			lastMowDate: lastMowDate ?? null,
			lastProductAppDate: lastProductAppDate ?? null,
		};
	}
}
