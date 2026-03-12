import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddImageCreditToProducts1773310463000
	implements MigrationInterface
{
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      ALTER TABLE products
      ADD COLUMN image_credit VARCHAR(255) NULL;
    `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      ALTER TABLE products
      DROP COLUMN IF EXISTS image_credit;
    `);
	}
}
