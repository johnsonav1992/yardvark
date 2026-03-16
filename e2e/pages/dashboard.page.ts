import { expect, type Page } from "@playwright/test";

export class DashboardPage {
	constructor(private readonly page: Page) {}

	async goto() {
		await this.page.goto("/dashboard");
		await this.page.waitForURL("**/dashboard", { timeout: 15000 });
	}

	async expectLoaded() {
		await expect(this.page.locator("h1")).toHaveText("Dashboard", {
			timeout: 15000,
		});
	}

	async expectWidgetsVisible() {
		await expect(this.page.locator("card-skeleton")).toHaveCount(0, {
			timeout: 15000,
		});
		await expect(this.page.locator(".widget-wrapper").first()).toBeVisible();
	}
}
