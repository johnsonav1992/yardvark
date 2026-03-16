import { expect, test } from "@playwright/test";
import { DashboardPage } from "../pages/dashboard.page";

test.describe("Dashboard", () => {
	test("shows page title", async ({ page }) => {
		const dashboard = new DashboardPage(page);

		await dashboard.goto();

		await dashboard.expectLoaded();
	});

	test("renders widgets after loading", async ({ page }) => {
		const dashboard = new DashboardPage(page);

		await dashboard.goto();
		await dashboard.expectLoaded();

		await dashboard.expectWidgetsVisible();
	});

	test("search button is visible", async ({ page }) => {
		const dashboard = new DashboardPage(page);

		await dashboard.goto();
		await dashboard.expectLoaded();

		await expect(page.getByRole("button", { name: /search/i })).toBeVisible();
	});
});
