import { test as setup } from "@playwright/test";

const AUTH_FILE = ".auth/user.json";

setup("authenticate", async ({ page }) => {
	await page.goto("/");

	await page.locator('input[name="username"]').fill(process.env["E2E_USERNAME"]!);
	await page.getByRole("button", { name: "Continue", exact: true }).click();

	await page.locator('input[name="password"]').fill(process.env["E2E_PASSWORD"]!);
	await page.getByRole("button", { name: "Continue", exact: true }).click();

	await page.waitForURL("**/dashboard", { timeout: 15000 });

	await page.context().storageState({ path: AUTH_FILE });
});
