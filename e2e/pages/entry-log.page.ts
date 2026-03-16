import { expect, type Page } from "@playwright/test";

import { waitForAngularStability } from "../helpers/angular";

export class EntryLogPage {
	constructor(private readonly page: Page) {}

	async goto() {
		await this.page.goto("/entry-log");
		await this.page.waitForURL("**/entry-log", { timeout: 15000 });
		await waitForAngularStability(this.page);
	}

	async expectCalendarVisible() {
		await expect(this.page.locator("entries-calendar")).toBeVisible({ timeout: 15000 });
	}

	async expectCreateEntryButtonVisible() {
		await expect(this.page.locator(".fab-container")).toBeVisible({ timeout: 15000 });
	}
}
