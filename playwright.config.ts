import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.e2e" });

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env["CI"],
	retries: process.env["CI"] ? 2 : 0,
	workers: process.env["CI"] ? 1 : undefined,
	reporter: "html",
	use: {
		baseURL: "http://localhost:4200",
		trace: "on-first-retry",
		actionTimeout: 15000,
	},
	projects: [
		{
			name: "setup",
			testMatch: /setup\/.*\.setup\.ts/,
		},
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				storageState: ".auth/user.json",
			},
			dependencies: ["setup"],
		},
	],
	webServer: {
		command: "ng serve --configuration e2e",
		url: "http://localhost:4200",
		reuseExistingServer: true,
		timeout: 120000,
	},
});
