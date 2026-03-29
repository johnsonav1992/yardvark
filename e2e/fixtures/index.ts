/** biome-ignore-all lint/correctness/noEmptyPattern: Playwright fixture syntax requires empty destructuring */

import * as fs from "node:fs";
import {
	type APIRequestContext,
	test as base,
	expect,
	request as playwrightRequest,
} from "@playwright/test";
import {
	resetEntryCreationUsage,
	setEntryCreationUsage,
} from "../db";

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

function readAuthState() {
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

	return token;
}

function getUserIdFromToken(token: string): string {
	const payload = JSON.parse(
		Buffer.from(token.split(".")[1], "base64").toString(),
	) as { sub: string };

	return payload.sub;
}

type AppFixtures = {
	api: APIRequestContext;
	userId: string;
	restoreSettings: () => Promise<void>;
	entryCleanup: (id: number) => void;
	productCleanup: (id: number) => void;
	resetEntryUsage: () => Promise<void>;
	setEntryUsage: (count: number) => Promise<void>;
	mockSlowEndpoints: undefined;
};

export const test = base.extend<AppFixtures>({
	api: async ({}, use) => {
		const token = readAuthState();

		const context = await playwrightRequest.newContext({
			baseURL: "http://localhost:8080",
			extraHTTPHeaders: { Authorization: `Bearer ${token}` },
		});

		await use(context);
		await context.dispose();
	},

	userId: async ({}, use) => {
		const token = readAuthState();

		await use(getUserIdFromToken(token));
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
				if (Number.isFinite(id)) {
					await api.delete(`/entries/${id}`);
				}
			}
		},
		{ scope: "test" },
	],

	productCleanup: [
		async ({ api }, use) => {
			const ids: number[] = [];

			await use((id: number) => {
				ids.push(id);
			});

			for (const id of ids) {
				if (Number.isFinite(id)) {
					await api.put(`/products/hide/${id}`);
				}
			}
		},
		{ scope: "test" },
	],

	resetEntryUsage: async ({ userId }, use) => {
		await use(() => resetEntryCreationUsage(userId));
	},

	setEntryUsage: async ({ userId }, use) => {
		await use((count: number) => setEntryCreationUsage(userId, count));
	},

	mockSlowEndpoints: [
		async ({ page }, use) => {
			await page.route("**/weather/forecast**", (route) =>
				route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ properties: { periods: [] } }),
				}),
			);

			await page.route("**/soil-data/rolling-week**", (route) =>
				route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({
						dates: [],
						shallowTemps: [],
						deepTemps: [],
						moisturePcts: [],
						temperatureUnit: "fahrenheit",
					}),
				}),
			);

			await page.route("**/soil-data/**", (route) =>
				route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify(null),
				}),
			);

			await use(undefined);
		},
		{ scope: "test", auto: true },
	],
});

export { expect };
