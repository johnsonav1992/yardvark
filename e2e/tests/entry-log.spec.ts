import { expect, test } from "../fixtures";
import { AddEntryPage } from "../pages/add-entry.page";
import { DashboardPage } from "../pages/dashboard.page";
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

	test("FAB navigates to add entry page", async ({ page }) => {
		const entryLog = new EntryLogPage(page);

		await entryLog.goto();
		await entryLog.clickCreateEntry();

		await expect(page.locator("h1")).toHaveText("Add Entries", {
			timeout: 15000,
		});
	});

	test("add entry cancel navigates back to entry log", async ({ page }) => {
		const addEntry = new AddEntryPage(page);

		await addEntry.goto();
		await addEntry.cancel();

		await expect(page.locator("entries-calendar")).toBeVisible({
			timeout: 15000,
		});
	});

	test("navigates from dashboard via the nav", async ({ page }) => {
		const dashboard = new DashboardPage(page);

		await dashboard.goto();

		await page.getByRole("link", { name: /entry log/i }).click();
		await page.waitForURL("**/entry-log", { timeout: 15000 });

		await expect(page.locator("entries-calendar")).toBeVisible({
			timeout: 15000,
		});
	});
});
