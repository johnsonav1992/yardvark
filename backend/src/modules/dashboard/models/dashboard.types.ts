import type { getEntryResponseMapping } from "../../entries/utils/entryUtils";

export type DashboardSummaryResponse = {
	recentEntry: ReturnType<typeof getEntryResponseMapping> | null;
	lastMowDate: Date | null;
	lastProductAppDate: Date | null;
};
