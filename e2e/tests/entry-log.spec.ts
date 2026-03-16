import { expect, test } from "@playwright/test";

import { waitForAngularStability } from "../helpers/angular";
import { EntryLogPage } from "../pages/entry-log.page";

test.describe("Entry Log", () => {
	test("renders the calendar", async ({ page }) => {
		const entryLog = new EntryLogPage(page);

		await entryLog.goto();

		await entryLog.expectCalendarVisible();
	});

	test("create entry FAB is visible", async ({ page }) => {
		const entryLog = new EntryLogPage(page);

		await entryLog.goto();

		await entryLog.expectCreateEntryButtonVisible();
	});

	test("navigates from dashboard via the nav", async ({ page }) => {
		await page.goto("/dashboard");
		await page.waitForURL("**/dashboard", { timeout: 15000 });
		await waitForAngularStability(page);

		await page.getByRole("link", { name: /entry log/i }).click();
		await page.waitForURL("**/entry-log", { timeout: 15000 });
		await waitForAngularStability(page);

		await expect(page.locator("entries-calendar")).toBeVisible({
			timeout: 15000,
		});
	});
});
