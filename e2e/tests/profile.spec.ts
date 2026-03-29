import { expect, test } from "../fixtures";

test.describe("Profile", () => {
	test("renders page title", async ({ page }) => {
		await page.goto("/profile");
		await page.waitForURL("**/profile", { timeout: 15000 });

		await expect(page.locator("h1")).toHaveText("Profile", { timeout: 15000 });
	});

	test("shows name and email sections", async ({ page }) => {
		await page.goto("/profile");
		await page.waitForURL("**/profile", { timeout: 15000 });

		await expect(
			page.locator(".section-wrapper", { hasText: "Name:" }),
		).toBeVisible({ timeout: 15000 });

		await expect(
			page.locator(".section-wrapper", { hasText: "Email:" }),
		).toBeVisible({ timeout: 15000 });
	});
});
