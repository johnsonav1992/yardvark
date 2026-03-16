import { expect, type Page } from "@playwright/test";

export class SettingsPage {
	constructor(private readonly page: Page) {}

	private sectionWithHeading(heading: string) {
		return this.page.locator(".section-wrapper", {
			has: this.page.locator("h4", { hasText: heading }),
		});
	}

	async goto() {
		await this.page.goto("/settings");
		await this.page.waitForURL("**/settings", { timeout: 15000 });
	}

	async expectLoaded() {
		await expect(this.page.locator("h1")).toHaveText("Settings", {
			timeout: 15000,
		});
	}

	async selectTemperatureUnit(label: "Fahrenheit" | "Celsius") {
		await this.sectionWithHeading("Temperature unit")
			.locator("p-select")
			.click();
		await this.page.locator(".p-select-option", { hasText: label }).click();
	}

	async expectTemperatureUnitToBe(label: "Fahrenheit" | "Celsius") {
		await expect(
			this.sectionWithHeading("Temperature unit").locator(".p-select-label"),
		).toHaveText(label, { timeout: 5000 });
	}

	async selectGrassType(label: "Warm season" | "Cool season") {
		await this.sectionWithHeading("Lawn type").locator("p-select").click();
		await this.page.locator(".p-select-option", { hasText: label }).click();
	}

	async expectGrassTypeToBe(label: "Warm season" | "Cool season") {
		await expect(
			this.sectionWithHeading("Lawn type").locator(".p-select-label"),
		).toHaveText(label, { timeout: 5000 });
	}

	async getHideSystemProductsChecked() {
		return this.sectionWithHeading("Hide system products")
			.locator("p-toggleswitch input")
			.isChecked();
	}

	async clickHideSystemProductsToggle() {
		await this.sectionWithHeading("Hide system products")
			.locator("p-toggleswitch")
			.click();
	}
}
