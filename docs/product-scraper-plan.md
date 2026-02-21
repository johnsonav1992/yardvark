# Lawn Care Product Scraper - Technical Implementation Plan

## Overview

Build a local Node.js/TypeScript scraper to populate the Yardvark database with lawn care products from various manufacturer and retailer sites.

**Goals:**

- Scrape 100s of products initially, scale to 1000s
- Cover categories: fertilizer, pre-emergent, post-emergent, PGR, fungus-control
- Run locally on-demand (every couple months)
- Output JSON matching the Product model for easy import

---

## Target Product Model

From `backend/src/modules/products/models/products.model.ts`:

| Field              | Type    | Required | Notes                                                              |
| ------------------ | ------- | -------- | ------------------------------------------------------------------ |
| name               | string  | Yes      | Product name                                                       |
| brand              | string  | Yes      | Manufacturer/brand                                                 |
| description        | string  | No       | Product description                                                |
| category           | enum    | Yes      | fertilizer, pre-emergent, post-emergent, pgr, fungus-control, etc. |
| price              | decimal | No       | Current price                                                      |
| quantityUnit       | string  | No       | lb, oz, gal, etc.                                                  |
| applicationRate    | string  | No       | "4 lbs per 1000 sq ft"                                             |
| applicationMethod  | string  | No       | Broadcast spreader, spray, etc.                                    |
| coverage           | number  | No       | Coverage area                                                      |
| coverageUnit       | string  | No       | sq ft                                                              |
| guaranteedAnalysis | string  | No       | NPK like "24-0-6"                                                  |
| containerType      | string  | No       | Bag, bottle, jug                                                   |
| imageUrl           | string  | No       | Product image URL                                                  |
| labelUrl           | string  | No       | Link to product label/SDS                                          |

---

## Project Structure

```
/scripts/product-scraper/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                 # CLI entry point
│   ├── config.ts                # Site configs, delays, etc.
│   ├── types.ts                 # Shared types
│   ├── scrapers/
│   │   ├── base-scraper.ts      # Abstract base class
│   │   ├── domyown-scraper.ts   # DoMyOwn implementation
│   │   ├── yard-mastery-scraper.ts
│   │   └── solutions-scraper.ts
│   ├── parsers/
│   │   ├── npk-parser.ts        # Parse "24-0-6" from various formats
│   │   ├── rate-parser.ts       # Parse application rates
│   │   └── category-mapper.ts   # Map site categories → Product enum
│   └── utils/
│       ├── rate-limiter.ts      # Polite delays between requests
│       ├── retry.ts             # Retry logic for failed requests
│       ├── cache.ts             # HTML caching for development
│       └── logger.ts            # Console logging with levels
├── cache/                       # Cached HTML pages (gitignored)
├── output/                      # Generated JSON files
└── README.md
```

---

## Technical Implementation Details

### 1. Package Configuration

**package.json:**

```json
{
  "name": "yardvark-product-scraper",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "scrape": "tsx src/index.ts scrape",
    "scrape:domyown": "tsx src/index.ts scrape --site domyown",
    "scrape:yardmastery": "tsx src/index.ts scrape --site yardmastery",
    "merge": "tsx src/index.ts merge",
    "import": "tsx src/index.ts import"
  },
  "dependencies": {
    "playwright": "^1.40.0",
    "commander": "^12.0.0",
    "chalk": "^5.3.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "tsx": "^4.7.0"
  }
}
```

**tsconfig.json:**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}
```

---

### 2. Core Types (src/types.ts)

```typescript
// Product categories matching backend enum
export const PRODUCT_CATEGORIES = {
  FERTILIZER: "fertilizer",
  PRE_EMERGENT: "pre-emergent",
  POST_EMERGENT: "post-emergent",
  PGR: "pgr",
  FUNGUS_CONTROL: "fungus-control",
  INSECT_CONTROL: "insect-control",
  BIO_STIMULANT: "bio-stimulant",
  SEED: "seed",
  OTHER: "other",
} as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[keyof typeof PRODUCT_CATEGORIES];

// Scraped product structure
export interface ScrapedProduct {
  name: string;
  brand: string;
  description?: string;
  category: ProductCategory;
  price?: number;
  quantityUnit?: string;
  applicationRate?: string;
  applicationMethod?: string;
  coverage?: number;
  coverageUnit?: string;
  guaranteedAnalysis?: string;
  containerType?: string;
  imageUrl?: string;
  labelUrl?: string;
  sourceUrl: string;
  sourceSite: string;
  scrapedAt: string;
}

// Category URL mapping for each site
export interface CategoryConfig {
  name: string;
  url: string;
  productCategory: ProductCategory;
}

// Scraper configuration
export interface ScraperConfig {
  siteName: string;
  baseUrl: string;
  categories: CategoryConfig[];
  requestDelayMs: number;
  maxRetries: number;
}

// Output file structure
export interface ScrapeOutput {
  scrapedAt: string;
  source: string;
  totalProducts: number;
  products: ScrapedProduct[];
  errors: ScrapeError[];
}

export interface ScrapeError {
  url: string;
  error: string;
  timestamp: string;
}
```

---

### 3. Configuration (src/config.ts)

```typescript
import { ScraperConfig, PRODUCT_CATEGORIES } from "./types.js";

export const SCRAPER_CONFIGS: Record<string, ScraperConfig> = {
  domyown: {
    siteName: "DoMyOwn",
    baseUrl: "https://www.domyown.com",
    requestDelayMs: 2500, // 2.5 seconds between requests
    maxRetries: 3,
    categories: [
      {
        name: "Pre-Emergent Herbicides",
        url: "/pre-emergent-herbicides-c-36_702.html",
        productCategory: PRODUCT_CATEGORIES.PRE_EMERGENT,
      },
      {
        name: "Post-Emergent Herbicides",
        url: "/post-emergent-herbicides-c-36_37.html",
        productCategory: PRODUCT_CATEGORIES.POST_EMERGENT,
      },
      {
        name: "Lawn Fungicides",
        url: "/lawn-fungicides-c-36_44.html",
        productCategory: PRODUCT_CATEGORIES.FUNGUS_CONTROL,
      },
      {
        name: "Plant Growth Regulators",
        url: "/plant-growth-regulators-c-36_706.html",
        productCategory: PRODUCT_CATEGORIES.PGR,
      },
    ],
  },

  yardmastery: {
    siteName: "Yard Mastery",
    baseUrl: "https://yardmastery.com",
    requestDelayMs: 2000,
    maxRetries: 3,
    categories: [
      {
        name: "Lawn Fertilizers",
        url: "/collections/lawn-fertilizers",
        productCategory: PRODUCT_CATEGORIES.FERTILIZER,
      },
      {
        name: "PGR",
        url: "/collections/pgr",
        productCategory: PRODUCT_CATEGORIES.PGR,
      },
      {
        name: "Bio-Stimulants",
        url: "/collections/bio-stimulants",
        productCategory: PRODUCT_CATEGORIES.BIO_STIMULANT,
      },
    ],
  },
};

export const GLOBAL_CONFIG = {
  outputDir: "./output",
  cacheDir: "./cache",
  userAgent: "YardvarkProductScraper/1.0 (lawn care app; product catalog)",
  headless: true, // Set to false for debugging
};
```

---

### 4. Utility Functions

**src/utils/rate-limiter.ts:**

```typescript
export function createRateLimiter(delayMs: number) {
  let lastRequestTime = 0;

  return async function waitForNextRequest(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < delayMs) {
      const waitTime = delayMs - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    lastRequestTime = Date.now();
  };
}
```

**src/utils/retry.ts:**

```typescript
import { logger } from "./logger.js";

export async function withRetry<T>(fn: () => Promise<T>, maxRetries: number, context: string): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      logger.warn(`Attempt ${attempt}/${maxRetries} failed for ${context}: ${lastError.message}`);

      if (attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 8s...
        const backoffMs = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw new Error(`All ${maxRetries} attempts failed for ${context}: ${lastError?.message}`);
}
```

**src/utils/cache.ts:**

```typescript
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { GLOBAL_CONFIG } from "../config.js";

function urlToFilename(url: string): string {
  const hash = crypto.createHash("md5").update(url).digest("hex").slice(0, 8);
  const safeName = url.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 50);
  return `${safeName}_${hash}.html`;
}

export async function getCachedHtml(url: string): Promise<string | null> {
  const filename = path.join(GLOBAL_CONFIG.cacheDir, urlToFilename(url));

  try {
    const stat = await fs.stat(filename);
    // Cache valid for 24 hours
    if (Date.now() - stat.mtimeMs < 24 * 60 * 60 * 1000) {
      return await fs.readFile(filename, "utf-8");
    }
  } catch {
    // File doesn't exist
  }

  return null;
}

export async function setCachedHtml(url: string, html: string): Promise<void> {
  await fs.mkdir(GLOBAL_CONFIG.cacheDir, { recursive: true });
  const filename = path.join(GLOBAL_CONFIG.cacheDir, urlToFilename(url));
  await fs.writeFile(filename, html, "utf-8");
}
```

**src/utils/logger.ts:**

```typescript
import chalk from "chalk";

type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private level: LogLevel = "info";

  setLevel(level: LogLevel) {
    this.level = level;
  }

  debug(message: string) {
    if (this.shouldLog("debug")) {
      console.log(chalk.gray(`[DEBUG] ${message}`));
    }
  }

  info(message: string) {
    if (this.shouldLog("info")) {
      console.log(chalk.blue(`[INFO] ${message}`));
    }
  }

  success(message: string) {
    console.log(chalk.green(`[SUCCESS] ${message}`));
  }

  warn(message: string) {
    if (this.shouldLog("warn")) {
      console.log(chalk.yellow(`[WARN] ${message}`));
    }
  }

  error(message: string) {
    console.error(chalk.red(`[ERROR] ${message}`));
  }

  progress(current: number, total: number, item: string) {
    const percent = Math.round((current / total) * 100);
    process.stdout.write(`\r${chalk.cyan(`[${current}/${total}]`)} ${percent}% - ${item.slice(0, 50)}...`);
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }
}

export const logger = new Logger();
```

---

### 5. Parsers

**src/parsers/npk-parser.ts:**

```typescript
/**
 * Parse NPK (Nitrogen-Phosphorus-Potassium) values from various string formats
 *
 * Examples:
 * - "24-0-6" → "24-0-6"
 * - "24-0-6 with 2% Iron" → "24-0-6"
 * - "Guaranteed Analysis: N 24%, P 0%, K 6%" → "24-0-6"
 * - "Contains 24% Nitrogen" → "24-0-0" (partial)
 */
export function parseNPK(text: string): string | null {
  if (!text) return null;

  // Direct format: "24-0-6"
  const directMatch = text.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  if (directMatch) {
    const [, n, p, k] = directMatch;
    return `${n}-${p}-${k}`;
  }

  // Percentage format: "N: 24%, P: 0%, K: 6%"
  const nMatch = text.match(/(?:nitrogen|N)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*%?/i);
  const pMatch = text.match(/(?:phosphorus|phosphate|P)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*%?/i);
  const kMatch = text.match(/(?:potassium|potash|K)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*%?/i);

  if (nMatch || pMatch || kMatch) {
    const n = nMatch ? nMatch[1] : "0";
    const p = pMatch ? pMatch[1] : "0";
    const k = kMatch ? kMatch[1] : "0";
    return `${n}-${p}-${k}`;
  }

  return null;
}

/**
 * Extract additional nutrients beyond NPK
 */
export function parseAdditionalNutrients(text: string): Record<string, string> {
  const nutrients: Record<string, string> = {};

  const patterns = [
    { name: "Iron", regex: /iron\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*%?/i },
    { name: "Sulfur", regex: /sulfur\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*%?/i },
    { name: "Manganese", regex: /manganese\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*%?/i },
    { name: "Zinc", regex: /zinc\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*%?/i },
  ];

  for (const { name, regex } of patterns) {
    const match = text.match(regex);
    if (match) {
      nutrients[name] = `${match[1]}%`;
    }
  }

  return nutrients;
}
```

**src/parsers/rate-parser.ts:**

```typescript
/**
 * Parse application rate strings into structured data
 *
 * Examples:
 * - "4 lbs per 1,000 sq ft" → { amount: 4, unit: "lbs", per: 1000, perUnit: "sq ft" }
 * - "0.5-1 oz per gallon" → { amount: "0.5-1", unit: "oz", per: 1, perUnit: "gallon" }
 */
export interface ApplicationRate {
  amount: string;
  unit: string;
  per?: number;
  perUnit?: string;
  raw: string;
}

export function parseApplicationRate(text: string): ApplicationRate | null {
  if (!text) return null;

  // Pattern: "X unit per Y unit"
  const perPattern = /(\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?)\s*(lbs?|oz|gallons?|quarts?|fl\s*oz|ml|g)\s*(?:per|\/)\s*([\d,]+)\s*(sq\s*ft|acres?|gallons?|1000\s*sq\s*ft)/i;

  const match = text.match(perPattern);
  if (match) {
    const [, amount, unit, per, perUnit] = match;
    return {
      amount: amount.trim(),
      unit: unit.toLowerCase(),
      per: parseInt(per.replace(/,/g, "")),
      perUnit: perUnit.toLowerCase().replace(/\s+/g, " "),
      raw: text,
    };
  }

  // Simple pattern: "X unit"
  const simplePattern = /(\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?)\s*(lbs?|oz|gallons?|quarts?)/i;
  const simpleMatch = text.match(simplePattern);
  if (simpleMatch) {
    const [, amount, unit] = simpleMatch;
    return {
      amount: amount.trim(),
      unit: unit.toLowerCase(),
      raw: text,
    };
  }

  return { raw: text, amount: "", unit: "" };
}

/**
 * Parse coverage area from strings
 *
 * Examples:
 * - "Covers up to 5,000 sq ft" → { coverage: 5000, unit: "sq ft" }
 * - "1 acre coverage" → { coverage: 43560, unit: "sq ft" }
 */
export function parseCoverage(text: string): { coverage: number; unit: string } | null {
  if (!text) return null;

  // Square feet
  const sqftMatch = text.match(/([\d,]+)\s*(?:sq\.?\s*ft\.?|square\s*feet)/i);
  if (sqftMatch) {
    return {
      coverage: parseInt(sqftMatch[1].replace(/,/g, "")),
      unit: "sq ft",
    };
  }

  // Acres (convert to sq ft)
  const acreMatch = text.match(/([\d.]+)\s*acres?/i);
  if (acreMatch) {
    const acres = parseFloat(acreMatch[1]);
    return {
      coverage: Math.round(acres * 43560),
      unit: "sq ft",
    };
  }

  return null;
}
```

**src/parsers/category-mapper.ts:**

```typescript
import { ProductCategory, PRODUCT_CATEGORIES } from "../types.js";

// Map site-specific category names to our enum
const CATEGORY_MAPPINGS: Record<string, ProductCategory> = {
  // DoMyOwn categories
  "pre-emergent herbicides": PRODUCT_CATEGORIES.PRE_EMERGENT,
  "pre-emergent": PRODUCT_CATEGORIES.PRE_EMERGENT,
  "post-emergent herbicides": PRODUCT_CATEGORIES.POST_EMERGENT,
  "post-emergent": PRODUCT_CATEGORIES.POST_EMERGENT,
  "lawn fungicides": PRODUCT_CATEGORIES.FUNGUS_CONTROL,
  fungicides: PRODUCT_CATEGORIES.FUNGUS_CONTROL,
  fungicide: PRODUCT_CATEGORIES.FUNGUS_CONTROL,
  "plant growth regulators": PRODUCT_CATEGORIES.PGR,
  pgr: PRODUCT_CATEGORIES.PGR,
  insecticides: PRODUCT_CATEGORIES.INSECT_CONTROL,
  "insect control": PRODUCT_CATEGORIES.INSECT_CONTROL,

  // Yard Mastery categories
  "lawn fertilizers": PRODUCT_CATEGORIES.FERTILIZER,
  fertilizer: PRODUCT_CATEGORIES.FERTILIZER,
  "bio-stimulants": PRODUCT_CATEGORIES.BIO_STIMULANT,
  biostimulant: PRODUCT_CATEGORIES.BIO_STIMULANT,
  "grass seed": PRODUCT_CATEGORIES.SEED,
  seed: PRODUCT_CATEGORIES.SEED,
};

export function mapCategory(siteCategory: string): ProductCategory {
  const normalized = siteCategory.toLowerCase().trim();
  return CATEGORY_MAPPINGS[normalized] || PRODUCT_CATEGORIES.OTHER;
}
```

---

### 6. Base Scraper Class (src/scrapers/base-scraper.ts)

```typescript
import { chromium, Browser, Page, BrowserContext } from "playwright";
import { ScraperConfig, ScrapedProduct, ScrapeOutput, ScrapeError, CategoryConfig } from "../types.js";
import { createRateLimiter } from "../utils/rate-limiter.js";
import { withRetry } from "../utils/retry.js";
import { getCachedHtml, setCachedHtml } from "../utils/cache.js";
import { logger } from "../utils/logger.js";
import { GLOBAL_CONFIG } from "../config.js";
import fs from "fs/promises";
import path from "path";

export abstract class BaseScraper {
  protected config: ScraperConfig;
  protected browser: Browser | null = null;
  protected context: BrowserContext | null = null;
  protected rateLimiter: () => Promise<void>;

  constructor(config: ScraperConfig) {
    this.config = config;
    this.rateLimiter = createRateLimiter(config.requestDelayMs);
  }

  // Abstract methods - each site implements these
  abstract scrapeProductList(page: Page, categoryUrl: string): Promise<string[]>;
  abstract scrapeProductDetails(page: Page, productUrl: string, category: string): Promise<ScrapedProduct | null>;

  async initialize(): Promise<void> {
    logger.info(`Initializing ${this.config.siteName} scraper...`);

    this.browser = await chromium.launch({
      headless: GLOBAL_CONFIG.headless,
    });

    this.context = await this.browser.newContext({
      userAgent: GLOBAL_CONFIG.userAgent,
      viewport: { width: 1280, height: 720 },
    });
  }

  async cleanup(): Promise<void> {
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
    logger.info(`Cleaned up ${this.config.siteName} scraper`);
  }

  async scrapeAll(categories?: string[]): Promise<ScrapeOutput> {
    await this.initialize();

    const products: ScrapedProduct[] = [];
    const errors: ScrapeError[] = [];

    try {
      const categoriesToScrape = categories ? this.config.categories.filter((c) => categories.includes(c.productCategory)) : this.config.categories;

      for (const category of categoriesToScrape) {
        logger.info(`\nScraping category: ${category.name}`);

        const categoryProducts = await this.scrapeCategory(category, errors);
        products.push(...categoryProducts);

        logger.success(`Found ${categoryProducts.length} products in ${category.name}`);
      }
    } finally {
      await this.cleanup();
    }

    const output: ScrapeOutput = {
      scrapedAt: new Date().toISOString(),
      source: this.config.siteName.toLowerCase().replace(/\s+/g, "-"),
      totalProducts: products.length,
      products,
      errors,
    };

    await this.saveOutput(output);
    return output;
  }

  protected async scrapeCategory(category: CategoryConfig, errors: ScrapeError[]): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    const page = await this.context!.newPage();

    try {
      // Get list of product URLs
      const fullUrl = `${this.config.baseUrl}${category.url}`;
      await this.rateLimiter();

      logger.info(`Loading category page: ${fullUrl}`);
      await page.goto(fullUrl, { waitUntil: "networkidle", timeout: 30000 });

      const productUrls = await this.scrapeProductList(page, fullUrl);
      logger.info(`Found ${productUrls.length} product URLs`);

      // Scrape each product
      for (let i = 0; i < productUrls.length; i++) {
        const productUrl = productUrls[i];
        logger.progress(i + 1, productUrls.length, productUrl);

        try {
          await this.rateLimiter();

          const product = await withRetry(() => this.scrapeProductPage(page, productUrl, category.productCategory), this.config.maxRetries, productUrl);

          if (product) {
            products.push(product);
          }
        } catch (error) {
          errors.push({
            url: productUrl,
            error: (error as Error).message,
            timestamp: new Date().toISOString(),
          });
        }
      }

      console.log(); // New line after progress
    } finally {
      await page.close();
    }

    return products;
  }

  protected async scrapeProductPage(page: Page, productUrl: string, category: string): Promise<ScrapedProduct | null> {
    // Check cache first
    const cached = await getCachedHtml(productUrl);

    if (cached) {
      await page.setContent(cached);
    } else {
      await page.goto(productUrl, { waitUntil: "networkidle", timeout: 30000 });
      const html = await page.content();
      await setCachedHtml(productUrl, html);
    }

    return this.scrapeProductDetails(page, productUrl, category);
  }

  protected async saveOutput(output: ScrapeOutput): Promise<void> {
    await fs.mkdir(GLOBAL_CONFIG.outputDir, { recursive: true });

    const filename = `${output.source}-products.json`;
    const filepath = path.join(GLOBAL_CONFIG.outputDir, filename);

    await fs.writeFile(filepath, JSON.stringify(output, null, 2));
    logger.success(`\nSaved ${output.totalProducts} products to ${filepath}`);

    if (output.errors.length > 0) {
      logger.warn(`${output.errors.length} errors occurred (see output file)`);
    }
  }

  // Helper methods for common extraction patterns
  protected extractText(page: Page, selector: string): Promise<string | null> {
    return page
      .locator(selector)
      .first()
      .textContent()
      .catch(() => null);
  }

  protected extractAttribute(page: Page, selector: string, attr: string): Promise<string | null> {
    return page
      .locator(selector)
      .first()
      .getAttribute(attr)
      .catch(() => null);
  }

  protected async extractPrice(page: Page, selector: string): Promise<number | null> {
    const text = await this.extractText(page, selector);
    if (!text) return null;

    const match = text.match(/\$?([\d,]+(?:\.\d{2})?)/);
    return match ? parseFloat(match[1].replace(/,/g, "")) : null;
  }
}
```

---

### 7. DoMyOwn Scraper Implementation (src/scrapers/domyown-scraper.ts)

```typescript
import { Page } from "playwright";
import { BaseScraper } from "./base-scraper.js";
import { ScrapedProduct, PRODUCT_CATEGORIES } from "../types.js";
import { SCRAPER_CONFIGS } from "../config.js";
import { parseNPK } from "../parsers/npk-parser.js";
import { parseCoverage } from "../parsers/rate-parser.js";
import { logger } from "../utils/logger.js";

export class DoMyOwnScraper extends BaseScraper {
  constructor() {
    super(SCRAPER_CONFIGS.domyown);
  }

  async scrapeProductList(page: Page, categoryUrl: string): Promise<string[]> {
    const productUrls: string[] = [];
    let hasNextPage = true;
    let pageNum = 1;

    while (hasNextPage) {
      logger.debug(`Scraping page ${pageNum} of product list`);

      // Extract product links from current page
      // DoMyOwn uses a product grid with links in .product-item-link or similar
      const links = await page.locator(".product-item a.product-item-link, .products-grid a.product-link").evaluateAll((elements: HTMLAnchorElement[]) => elements.map((el) => el.href).filter((href) => href.includes("/p-")));

      productUrls.push(...links);

      // Check for next page
      // DoMyOwn pagination typically has a "Next" link or numbered pages
      const nextButton = page.locator('a.next, .pagination a:has-text("Next"), a[rel="next"]');

      if ((await nextButton.count()) > 0 && (await nextButton.first().isVisible())) {
        await this.rateLimiter();
        await nextButton.first().click();
        await page.waitForLoadState("networkidle");
        pageNum++;
      } else {
        hasNextPage = false;
      }

      // Safety limit
      if (pageNum > 50) {
        logger.warn("Reached page limit (50), stopping pagination");
        break;
      }
    }

    // Deduplicate
    return [...new Set(productUrls)];
  }

  async scrapeProductDetails(page: Page, productUrl: string, category: string): Promise<ScrapedProduct | null> {
    try {
      // Product name - usually in h1 or .product-name
      const name = await this.extractText(page, 'h1.product-name, h1[itemprop="name"], .product-title h1');
      if (!name) {
        logger.warn(`No product name found at ${productUrl}`);
        return null;
      }

      // Brand - often in a .brand element or breadcrumb
      const brand = (await this.extractText(page, '.product-brand, [itemprop="brand"], .brand-name')) || (await this.extractBrandFromBreadcrumb(page)) || "Unknown";

      // Price
      const price = await this.extractPrice(page, '.price, [itemprop="price"], .product-price .amount');

      // Description
      const description = await this.extractText(page, '.product-description, [itemprop="description"], .description-content');

      // Image URL
      const imageUrl = await this.extractAttribute(page, '.product-image img, [itemprop="image"], .gallery-image img', "src");

      // Label/SDS PDF link
      const labelUrl = await this.extractAttribute(page, 'a[href*=".pdf"]:has-text("Label"), a[href*=".pdf"]:has-text("SDS"), a.product-label', "href");

      // Coverage area
      const coverageText = await this.extractText(page, '.coverage, .product-coverage, td:has-text("Coverage") + td');
      const coverageData = parseCoverage(coverageText || "");

      // Application rate
      const applicationRate = await this.extractText(page, '.application-rate, td:has-text("Application Rate") + td, .rate-info');

      // Try to extract guaranteed analysis / active ingredients
      const analysisText = await this.extractText(page, '.guaranteed-analysis, .active-ingredients, td:has-text("Active") + td');
      const guaranteedAnalysis = parseNPK(analysisText || "");

      // Container/package info
      const quantityText = await this.extractText(page, ".product-size, .package-size, .variant-size");
      const { quantity, unit } = this.parseQuantity(quantityText || "");

      return {
        name: name.trim(),
        brand: brand.trim(),
        description: description?.trim().slice(0, 1000), // Limit length
        category,
        price: price || undefined,
        quantityUnit: unit,
        applicationRate: applicationRate?.trim(),
        coverage: coverageData?.coverage,
        coverageUnit: coverageData?.unit,
        guaranteedAnalysis: guaranteedAnalysis || undefined,
        imageUrl: imageUrl ? this.resolveUrl(imageUrl) : undefined,
        labelUrl: labelUrl ? this.resolveUrl(labelUrl) : undefined,
        sourceUrl: productUrl,
        sourceSite: "domyown",
        scrapedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Error scraping ${productUrl}: ${(error as Error).message}`);
      return null;
    }
  }

  private async extractBrandFromBreadcrumb(page: Page): Promise<string | null> {
    // Often the brand is in the breadcrumb trail
    const breadcrumbs = await page.locator(".breadcrumb a, .breadcrumbs a").allTextContents();

    // The brand is usually the second-to-last breadcrumb
    if (breadcrumbs.length >= 2) {
      return breadcrumbs[breadcrumbs.length - 2];
    }
    return null;
  }

  private parseQuantity(text: string): { quantity?: number; unit?: string } {
    if (!text) return {};

    const match = text.match(/([\d.]+)\s*(lb|oz|gal|quart|pt|fl oz|ml|kg|g)/i);
    if (match) {
      return {
        quantity: parseFloat(match[1]),
        unit: match[2].toLowerCase(),
      };
    }
    return {};
  }

  private resolveUrl(url: string): string {
    if (url.startsWith("http")) return url;
    if (url.startsWith("//")) return `https:${url}`;
    return `${this.config.baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  }
}
```

---

### 8. CLI Entry Point (src/index.ts)

```typescript
import { Command } from "commander";
import { DoMyOwnScraper } from "./scrapers/domyown-scraper.js";
// import { YardMasteryScraper } from './scrapers/yard-mastery-scraper.js';
import { logger } from "./utils/logger.js";
import { PRODUCT_CATEGORIES } from "./types.js";
import fs from "fs/promises";
import path from "path";
import { GLOBAL_CONFIG } from "./config.js";

const program = new Command();

program.name("product-scraper").description("Scrape lawn care products for Yardvark").version("1.0.0");

program
  .command("scrape")
  .description("Scrape products from specified site(s)")
  .option("-s, --site <site>", "Site to scrape (domyown, yardmastery, all)", "all")
  .option("-c, --category <category>", "Category to scrape (pre-emergent, fertilizer, etc.)")
  .option("--dry-run", "Show what would be scraped without actually scraping")
  .option("-v, --verbose", "Enable verbose logging")
  .action(async (options) => {
    if (options.verbose) {
      logger.setLevel("debug");
    }

    const categories = options.category ? [options.category] : undefined;

    if (options.dryRun) {
      logger.info("DRY RUN - showing what would be scraped:");
      logger.info(`Site: ${options.site}`);
      logger.info(`Categories: ${categories?.join(", ") || "all"}`);
      return;
    }

    const scrapers: Record<string, () => Promise<void>> = {
      domyown: async () => {
        const scraper = new DoMyOwnScraper();
        await scraper.scrapeAll(categories);
      },
      // yardmastery: async () => {
      //   const scraper = new YardMasteryScraper();
      //   await scraper.scrapeAll(categories);
      // },
    };

    try {
      if (options.site === "all") {
        for (const [name, scrape] of Object.entries(scrapers)) {
          logger.info(`\n${"=".repeat(50)}`);
          logger.info(`Starting ${name} scraper`);
          logger.info("=".repeat(50));
          await scrape();
        }
      } else if (scrapers[options.site]) {
        await scrapers[options.site]();
      } else {
        logger.error(`Unknown site: ${options.site}`);
        logger.info(`Available sites: ${Object.keys(scrapers).join(", ")}`);
        process.exit(1);
      }
    } catch (error) {
      logger.error(`Scraping failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command("merge")
  .description("Merge all output files into a single file")
  .action(async () => {
    const outputDir = GLOBAL_CONFIG.outputDir;
    const files = await fs.readdir(outputDir);
    const jsonFiles = files.filter((f) => f.endsWith("-products.json") && f !== "merged-products.json");

    const allProducts: any[] = [];
    const sources: string[] = [];

    for (const file of jsonFiles) {
      const content = await fs.readFile(path.join(outputDir, file), "utf-8");
      const data = JSON.parse(content);
      allProducts.push(...data.products);
      sources.push(data.source);
    }

    // Deduplicate by name + brand
    const seen = new Set<string>();
    const deduped = allProducts.filter((p) => {
      const key = `${p.name.toLowerCase()}|${p.brand.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const merged = {
      mergedAt: new Date().toISOString(),
      sources,
      totalProducts: deduped.length,
      duplicatesRemoved: allProducts.length - deduped.length,
      products: deduped,
    };

    const outputPath = path.join(outputDir, "merged-products.json");
    await fs.writeFile(outputPath, JSON.stringify(merged, null, 2));

    logger.success(`Merged ${deduped.length} products from ${sources.length} sources`);
    logger.info(`Removed ${allProducts.length - deduped.length} duplicates`);
    logger.info(`Output: ${outputPath}`);
  });

program
  .command("stats")
  .description("Show statistics about scraped products")
  .action(async () => {
    const outputDir = GLOBAL_CONFIG.outputDir;
    const files = await fs.readdir(outputDir);
    const jsonFiles = files.filter((f) => f.endsWith("-products.json"));

    for (const file of jsonFiles) {
      const content = await fs.readFile(path.join(outputDir, file), "utf-8");
      const data = JSON.parse(content);

      console.log(`\n${file}:`);
      console.log(`  Total products: ${data.totalProducts}`);
      console.log(`  Scraped at: ${data.scrapedAt}`);
      console.log(`  Errors: ${data.errors?.length || 0}`);

      // Category breakdown
      const categories: Record<string, number> = {};
      for (const product of data.products) {
        categories[product.category] = (categories[product.category] || 0) + 1;
      }
      console.log("  Categories:");
      for (const [cat, count] of Object.entries(categories)) {
        console.log(`    ${cat}: ${count}`);
      }
    }
  });

program.parse();
```

---

## Scraping Strategy Per Site

### DoMyOwn.com

**Page Structure:**

- Category pages: `/pre-emergent-herbicides-c-36_702.html`
- Product pages: `/product-name-p-12345.html`
- Uses server-rendered HTML with JavaScript enhancements

**Key Selectors (to be verified):**

```typescript
const DOMYOWN_SELECTORS = {
  // Product list page
  productLinks: ".product-item a.product-item-link",
  pagination: 'a.next, .pagination a[rel="next"]',

  // Product detail page
  name: 'h1.product-name, h1[itemprop="name"]',
  brand: '.product-brand, [itemprop="brand"]',
  price: '.price, [itemprop="price"]',
  description: '.product-description, [itemprop="description"]',
  image: '.product-image img, [itemprop="image"]',
  labelPdf: 'a[href*=".pdf"]:has-text("Label")',
  specs: ".product-specs table tr", // Key-value pairs
};
```

**Pagination Handling:**

- Click "Next" button until it disappears
- Or detect total pages and iterate

### Yard Mastery (Shopify)

**Page Structure:**

- Category pages: `/collections/lawn-fertilizers`
- Product pages: `/products/product-slug`
- Shopify-based, uses JSON-LD structured data

**Key Selectors:**

```typescript
const YARDMASTERY_SELECTORS = {
  // Product list page
  productLinks: ".product-card a, .collection-product a",
  loadMore: 'button:has-text("Load More")', // Infinite scroll

  // Product detail page - often has JSON-LD
  jsonLd: 'script[type="application/ld+json"]',
  name: "h1.product-title",
  price: ".product-price, [data-product-price]",
  description: ".product-description",
};
```

**Pagination Handling:**

- Shopify often uses infinite scroll
- May need to scroll and wait for more products to load
- Or use collection API: `/collections/slug/products.json`

---

## Error Handling & Recovery

1. **Network failures**: Retry with exponential backoff (2s, 4s, 8s)
2. **Rate limiting (429)**: Back off for 60 seconds, then retry
3. **Page not found (404)**: Log and skip
4. **Parsing errors**: Log error, save partial data if possible
5. **Timeout**: Increase timeout, retry once

**Resume Capability:**

- Save progress after each product
- On restart, check output file and skip already-scraped URLs

---

## Running the Scraper

```bash
# Install dependencies
cd scripts/product-scraper
npm install

# Install Playwright browsers
npx playwright install chromium

# Run DoMyOwn scraper (all categories)
npm run scrape:domyown

# Run specific category
npx tsx src/index.ts scrape --site domyown --category pre-emergent

# Verbose mode for debugging
npx tsx src/index.ts scrape --site domyown -v

# Merge all output files
npm run merge

# View statistics
npx tsx src/index.ts stats
```

---

## Questions / Decisions

1. **Global vs user products**: Should scraped products be available to all users, or imported as "system" products separate from user-created ones?

2. **Price tracking**: Do we want to track price history, or just current price at scrape time?

3. **Image hosting**: Download and re-host images, or just link to source URLs?

4. **Deduplication**: Same product on multiple sites - keep all entries or merge?

---

## Implementation Phases

### Phase 1: Foundation (Day 1)

- [x] Project structure and package.json
- [x] TypeScript configuration
- [x] Core types and interfaces
- [x] Utility functions (rate limiter, retry, cache, logger)
- [x] Base scraper class

### Phase 2: DoMyOwn Scraper (Day 1-2)

- [ ] Analyze actual DoMyOwn page structure
- [ ] Implement and test product list scraper
- [ ] Implement and test product detail scraper
- [ ] Handle pagination
- [ ] Test with pre-emergent category
- [ ] Expand to all categories

### Phase 3: Additional Scrapers (Day 3+)

- [ ] Yard Mastery scraper
- [ ] Solutions Pest & Lawn scraper

### Phase 4: Import Pipeline

- [ ] Backend bulk import endpoint
- [ ] Validation and conflict resolution
