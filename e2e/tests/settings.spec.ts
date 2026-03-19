import { test } from "../fixtures";
import { SettingsPage } from "../pages/settings.page";

test.describe.configure({ mode: "serial" });

test.describe("Settings", () => {
	test("shows page title", async ({ page }) => {
		const settings = new SettingsPage(page);

		await settings.goto();

		await settings.expectLoaded();
	});

	test("temperature unit can be changed", async ({ page, restoreSettings: _restore }) => {
		const settings = new SettingsPage(page);

		await settings.goto();
		await settings.expectLoaded();

		await settings.selectTemperatureUnit("Celsius");
		await settings.expectTemperatureUnitToBe("Celsius");

		await settings.selectTemperatureUnit("Fahrenheit");
		await settings.expectTemperatureUnitToBe("Fahrenheit");
	});

	test("grass type can be changed", async ({ page, restoreSettings: _restore }) => {
		const settings = new SettingsPage(page);

		await settings.goto();
		await settings.expectLoaded();

		await settings.selectGrassType("Warm season");
		await settings.expectGrassTypeToBe("Warm season");

		await settings.selectGrassType("Cool season");
		await settings.expectGrassTypeToBe("Cool season");
	});

	test("hide system products toggle can be switched", async ({
		page,
		restoreSettings: _restore,
	}) => {
		const settings = new SettingsPage(page);

		await settings.goto();
		await settings.expectLoaded();

		await settings.expectHideSystemProductsChecked(false);

		await settings.clickHideSystemProductsToggle();

		await settings.expectHideSystemProductsChecked(true);
	});
});
