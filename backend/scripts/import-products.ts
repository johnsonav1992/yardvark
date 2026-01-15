/**
 * Import scraped products into the database
 *
 * Usage:
 *   npm run import-products -- /path/to/domyown-products-db-ready.json
 *
 * Note: Scraped products are assigned to userId "system" by default.
 * These are public products available to all users.
 */

import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { Product } from '../src/modules/products/models/products.model';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface DbReadyProduct {
  userId: string;
  name: string;
  brand: string;
  category: string;
  description?: string;
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
}

interface ImportFile {
  preparedAt: string;
  userId: string;
  source: string;
  totalProducts: number;
  invalidProducts: number;
  products: DbReadyProduct[];
}

async function importProducts(filePath: string) {
  console.log(`\n📦 Importing products from: ${filePath}\n`);

  // Read the file
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const data: ImportFile = JSON.parse(fileContent);

  console.log(`Source: ${data.source}`);
  console.log(`Prepared at: ${data.preparedAt}`);
  console.log(`Total products: ${data.totalProducts}`);
  console.log(`User ID: ${data.userId}\n`);

  // Initialize database connection (using same env vars as backend)
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.PRODPGHOST || 'localhost',
    port: parseInt(process.env.PRODPGPORT || '5432'),
    username: process.env.PRODPGUSER,
    password: process.env.PRODPGPASSWORD,
    database: process.env.PRODPGDATABASE,
    ssl: true, // Required for hosted databases
    entities: [__dirname + '/../src/**/models/*.model.{ts,js}'], // Load all entities
    synchronize: false, // Don't auto-sync schema
    namingStrategy: new SnakeNamingStrategy(), // Use snake_case for database columns
  });

  console.log('🔌 Connecting to database...');
  await dataSource.initialize();
  console.log('✅ Connected!\n');

  const productRepository = dataSource.getRepository(Product);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  console.log('📥 Importing products...\n');

  for (const productData of data.products) {
    try {
      // Check if product already exists (by name + brand)
      const existing = await productRepository.findOne({
        where: {
          name: productData.name,
          brand: productData.brand,
          userId: productData.userId,
        },
      });

      if (existing) {
        console.log(`⏭️  Skipped (exists): ${productData.name}`);
        skipped++;
        continue;
      }

      // Create new product
      const product = productRepository.create(productData);
      await productRepository.save(product);

      console.log(`✅ Imported: ${productData.name}`);
      imported++;
    } catch (error) {
      console.error(
        `❌ Error importing ${productData.name}:`,
        (error as Error).message,
      );
      errors++;
    }
  }

  await dataSource.destroy();

  console.log('\n' + '='.repeat(60));
  console.log('📊 Import Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Imported:  ${imported} products`);
  console.log(`⏭️  Skipped:   ${skipped} products (already exist)`);
  console.log(`❌ Errors:    ${errors} products`);
  console.log('='.repeat(60) + '\n');
}

// Main
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('❌ Error: Please provide a path to the db-ready JSON file');
  console.log('\nUsage:');
  console.log(
    '  npm run import-products -- /path/to/domyown-products-db-ready.json',
  );
  console.log(
    '  npm run import-products -- ../scraper/output/domyown-products-db-ready.json\n',
  );
  process.exit(1);
}

const filePath = path.resolve(args[0]);
if (!fs.existsSync(filePath)) {
  console.error(`❌ Error: File not found: ${filePath}\n`);
  process.exit(1);
}

importProducts(filePath)
  .then(() => {
    console.log('✨ Done!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
