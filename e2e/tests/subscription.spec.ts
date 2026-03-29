import { expect, test } from "../fixtures";

test.describe("Subscription", () => {
	test("renders page with plan options", async ({ page }) => {
		await page.goto("/subscription");
		await page.waitForURL("**/subscription", { timeout: 15000 });

		await expect(page.locator("h1")).toHaveText("Subscription", {
			timeout: 15000,
		});

		await expect(page.locator("h3", { hasText: "Choose Your Plan" })).toBeVisible({
			timeout: 15000,
		});
	});
});
