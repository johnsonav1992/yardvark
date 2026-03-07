import { CheerioCrawler, Dataset, type RequestOptions } from "crawlee";

type StoreKey = "home-depot" | "lowes";

interface ProductRecord {
store: StoreKey;
searchTerm: string;
name: string;
priceText: string | null;
url: string | null;
scrapedAt: string;
}

interface StoreConfig {
store: StoreKey;
searchUrl: (query: string) => string;
productCardSelector: string;
nameSelector: string;
priceSelector: string;
linkSelector: string;
}

const query = process.env.LAWN_QUERY?.trim() || "fertilizer";

const maxRequests = Number.parseInt(process.env.MAX_REQUESTS_PER_CRAWL ?? "20", 10);

const stores: StoreConfig[] = [
{
store: "home-depot",
searchUrl: (searchTerm) => `https://www.homedepot.com/s/${encodeURIComponent(searchTerm)}`,
productCardSelector: '[data-testid="product-pod"]',
nameSelector: '[data-testid="product-title"]',
priceSelector: '[data-testid="price"]',
linkSelector: 'a[data-testid="product-card-link"]',
},
{
store: "lowes",
searchUrl: (searchTerm) => `https://www.lowes.com/search?searchTerm=${encodeURIComponent(searchTerm)}`,
productCardSelector: '[data-selector="content"]',
nameSelector: '[data-testid="product-title"]',
priceSelector: '[data-testid="price-amount"]',
linkSelector: 'a[data-testid="plp-product-tile-link"]',
},
];

const startUrls: RequestOptions[] = stores.map((storeConfig) => ({
url: storeConfig.searchUrl(query),
userData: {
store: storeConfig.store,
},
}));

const crawler = new CheerioCrawler({
maxRequestsPerCrawl: Number.isNaN(maxRequests) ? 20 : maxRequests,
requestHandler: async ({ request, $, log }) => {
const store = request.userData.store;

if (store !== "home-depot" && store !== "lowes") {
log.warning(`Skipping unsupported store for ${request.url}`);

return;
}

const storeConfig = stores.find((candidate) => candidate.store === store);

if (!storeConfig) {
log.warning(`No scraper config found for ${store}`);

return;
}

const products: ProductRecord[] = [];

$(storeConfig.productCardSelector)
.slice(0, 20)
.each((_, card) => {
const name = $(card).find(storeConfig.nameSelector).first().text().trim();

if (!name) {
return;
}

const priceText = $(card).find(storeConfig.priceSelector).first().text().trim() || null;
const productPath = $(card).find(storeConfig.linkSelector).first().attr("href") || null;
const url = productPath ? new URL(productPath, request.url).toString() : null;

products.push({
store,
searchTerm: query,
name,
priceText,
url,
scrapedAt: new Date().toISOString(),
});
});

await Dataset.pushData(products);

log.info(`Collected ${products.length} products from ${store}`);
},
failedRequestHandler: async ({ request, log }) => {
log.error(`Request ${request.url} failed too many times`);
},
});

await crawler.run(startUrls);
