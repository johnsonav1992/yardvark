# lawn-lurker

Standalone TypeScript scraper built with Crawlee for lawncare product discovery.

## Supported stores

- Home Depot
- Lowe's

## Usage

```bash
npm install
npm run crawl
```

Optional environment variables:

- `LAWN_QUERY` (default: `fertilizer`)
- `MAX_REQUESTS_PER_CRAWL` (default: `20`)

Scraped records are written to Crawlee storage (`./storage/datasets/default`).
