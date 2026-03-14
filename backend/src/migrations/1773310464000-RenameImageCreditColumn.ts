import type { MigrationInterface, QueryRunner } from "typeorm";

export class RenameImageCreditColumn1773310464000 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      ALTER TABLE products
      RENAME COLUMN "imageCredit" TO image_credit;
    `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      ALTER TABLE products
      RENAME COLUMN image_credit TO "imageCredit";
    `);
	}
}
