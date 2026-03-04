import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddMowingHeightToEntries1729594000000
	implements MigrationInterface
{
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      ALTER TABLE entries
      ADD COLUMN mowing_height DECIMAL NULL,
      ADD COLUMN mowing_height_unit VARCHAR NULL;
    `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      ALTER TABLE entries
      DROP COLUMN IF EXISTS mowing_height,
      DROP COLUMN IF EXISTS mowing_height_unit;
    `);
	}
}
