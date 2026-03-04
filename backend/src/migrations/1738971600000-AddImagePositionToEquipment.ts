import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddImagePositionToEquipment1738971600000
	implements MigrationInterface
{
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      ALTER TABLE equipment
      ADD COLUMN "imagePosition" VARCHAR(50) DEFAULT 'center center';
    `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      ALTER TABLE equipment
      DROP COLUMN IF EXISTS "imagePosition";
    `);
	}
}
