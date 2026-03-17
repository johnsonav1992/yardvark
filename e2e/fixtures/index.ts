/** biome-ignore-all lint/correctness/noEmptyPattern: Playwright fixture syntax requires empty destructuring */

import * as fs from "node:fs";
import {
	type APIRequestContext,
	test as base,
	expect,
	request as playwrightRequest,
} from "@playwright/test";

type StorageOrigin = {
	localStorage: Array<{ name: string; value: string }>;
};

const DEFAULT_SETTINGS = {
	temperatureUnit: "fahrenheit",
	grassType: "cool",
	lawnSize: 0,
	location: { address: "", lat: 0, long: 0 },
	entryView: "calendar",
	hideSystemProducts: false,
	hiddenWidgets: [],
	widgetOrder: [
		"recent-entry",
		"quick-stats",
		"lawn-health-score",
		"weather-card",
	],
	mobileNavbarItems: [],
} as const;

type AppFixtures = {
	api: APIRequestContext;
	restoreSettings: () => Promise<void>;
	entryCleanup: (id: number) => void;
};

export const test = base.extend<AppFixtures>({
	api: async ({}, use) => {
		const state = JSON.parse(fs.readFileSync(".auth/user.json", "utf-8")) as {
			origins: StorageOrigin[];
		};

		const entry = state.origins
			.flatMap((o) => o.localStorage)
			.find(
				(e) =>
					e.name.startsWith("@@auth0spajs@@") && !e.name.includes("@@user@@"),
			);

		const { access_token: token } = (
			JSON.parse(entry!.value) as { body: { access_token: string } }
		).body;

		const context = await playwrightRequest.newContext({
			baseURL: "http://localhost:8080",
			extraHTTPHeaders: { Authorization: `Bearer ${token}` },
		});

		await use(context);
		await context.dispose();
	},

	restoreSettings: [
		async ({ api }, use) => {
			const res = await api.get("/settings");
			const body = (await res.json()) as
				| { value: Record<string, unknown> }
				| unknown[];
			const original: Record<string, unknown> | null = Array.isArray(body)
				? null
				: body.value;

			await api.put("/settings", { data: { ...DEFAULT_SETTINGS } });

			let restored = false;

			const restore = async () => {
				if (!restored) {
					await api.put("/settings", {
						data: original ?? { ...DEFAULT_SETTINGS },
					});
					restored = true;
				}
			};

			await use(restore);
			await restore();
		},
		{ scope: "test" },
	],
	entryCleanup: [
		async ({ api }, use) => {
			const ids: number[] = [];

			await use((id: number) => {
				ids.push(id);
			});

			for (const id of ids) {
				await api.delete(`/entries/${id}`);
			}
		},
		{ scope: "test" },
	],
});

export { expect };
