import { expect, type Page } from "@playwright/test";

export class EntryLogPage {
	constructor(private readonly page: Page) {}

	async goto() {
		await this.page.goto("/entry-log");
		await this.page.waitForURL("**/entry-log", { timeout: 15000 });
	}

	async expectCalendarVisible() {
		await expect(this.page.locator("entries-calendar")).toBeVisible({ timeout: 15000 });
	}

	async expectCreateEntryButtonVisible() {
		await expect(this.page.locator(".fab-container")).toBeVisible({ timeout: 15000 });
	}

	async clickCreateEntry() {
		await this.page.locator(".fab-container").locator("button").last().click();
		await this.page.waitForURL("**/entry-log/add", { timeout: 15000 });
	}

	async clickFirstEntryMarker() {
		const marker = this.page.locator(".marker-container button").first();

		await expect(marker).toBeVisible({ timeout: 15000 });
		await marker.click();
	}
}
