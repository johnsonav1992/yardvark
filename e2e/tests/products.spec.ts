import { expect, test } from "../fixtures";
import { ProductsPage } from "../pages/products.page";

const E2E_PRODUCT_NAME = "E2E Test Product";

const PRODUCT_TABS = [
	"Fertilizer",
	"Pre-emergent",
	"Post-emergent",
	"Bio-stimulant",
	"PGR",
	"Plant-fertilizer",
	"Fungus-control",
	"Insect-control",
	"Seed",
	"Other",
] as const;

type ProductResponse = { id: number; name: string };

const E2E_PRODUCT_PAYLOAD = {
	name: E2E_PRODUCT_NAME,
	brand: "E2E Brand",
	category: "other",
};

test.describe("Products", () => {
	test("products page renders", async ({ page }) => {
		const products = new ProductsPage(page);

		await products.goto();
		await products.expectLoaded();
	});

	test("all category tabs are visible", async ({ page }) => {
		const products = new ProductsPage(page);

		await products.goto();
		await products.expectLoaded();

		for (const tab of PRODUCT_TABS) {
			await products.expectTabVisible(tab);
		}
	});

	test("add product button navigates to add product page", async ({ page }) => {
		const products = new ProductsPage(page);

		await products.goto();
		await products.expectLoaded();
		await products.clickAddProduct();

		await expect(page.locator("h1")).toHaveText("Add product", {
			timeout: 10000,
		});
	});

	test("search shows results section when text is entered", async ({ page }) => {
		const products = new ProductsPage(page);

		await products.goto();
		await products.expectLoaded();
		await products.search("fertilizer");
		await products.expectSearchResultsVisible();
	});

	test("can view a created product", async ({ api, page, productCleanup }) => {
		const res = await api.post("/products", {
			multipart: E2E_PRODUCT_PAYLOAD,
		});
		const product = (await res.json()) as ProductResponse;

		productCleanup(product.id);

		await page.goto(`/products/${product.id}`);
		await page.waitForURL(`**/products/${product.id}`, { timeout: 15000 });

		await expect(page.locator("h1")).toHaveText(E2E_PRODUCT_NAME, {
			timeout: 15000,
		});
	});
});
