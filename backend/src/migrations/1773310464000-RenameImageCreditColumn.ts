import type { MigrationInterface, QueryRunner } from "typeorm";

export class RenameImageCreditColumn1773310464000
	implements MigrationInterface
{
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'products' AND column_name = 'imageCredit'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'products' AND column_name = 'image_credit'
        ) THEN
          ALTER TABLE products RENAME COLUMN "imageCredit" TO image_credit;
        END IF;
      END $$;
    `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      ALTER TABLE products
      RENAME COLUMN image_credit TO "imageCredit";
    `);
	}
}
