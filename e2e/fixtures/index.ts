/** biome-ignore-all lint/correctness/noEmptyPattern: <explanation> */
import {
	type APIRequestContext,
	test as base,
	expect,
	request as playwrightRequest,
} from "@playwright/test";
import * as fs from "fs";

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
	widgetOrder: [],
	mobileNavbarItems: [],
} as const;

type AppFixtures = {
	api: APIRequestContext;
	restoreSettings: () => Promise<void>;
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
			let original: Record<string, unknown> = Array.isArray(body)
				? { ...DEFAULT_SETTINGS }
				: body.value;

			if (Array.isArray(body)) {
				await api.put("/settings", { data: original });
			}

			let restored = false;

			const restore = async () => {
				if (!restored) {
					await api.put("/settings", { data: original });
					restored = true;
				}
			};

			await use(restore);
			await restore();
		},
		{ scope: "test" },
	],
});

export { expect };
