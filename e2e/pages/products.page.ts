import { expect, type Page } from "@playwright/test";

export class ProductsPage {
	constructor(private readonly page: Page) {}

	async goto() {
		await this.page.goto("/products");
		await this.page.waitForURL("**/products", { timeout: 15000 });
	}

	async expectLoaded() {
		await expect(this.page.locator("h1")).toHaveText("Products", {
			timeout: 15000,
		});
	}

	async expectTabVisible(label: string) {
		await expect(
			this.page.getByRole("tab", { name: label, exact: true }),
		).toBeVisible({ timeout: 10000 });
	}

	async clickAddProduct() {
		await this.page.locator(".speed-dial").click();
		await this.page.waitForURL("**/products/add", { timeout: 15000 });
	}

	async search(text: string) {
		await this.page.getByLabel("Search").fill(text);
	}

	async expectSearchResultsVisible() {
		await expect(
			this.page.locator("h3", { hasText: "Search results" }),
		).toBeVisible({ timeout: 5000 });
	}
}
