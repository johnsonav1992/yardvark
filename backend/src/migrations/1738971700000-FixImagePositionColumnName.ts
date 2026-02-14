import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixImagePositionColumnName1738971700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE equipment
      RENAME COLUMN "imagePosition" TO image_position;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE equipment
      RENAME COLUMN image_position TO "imagePosition";
    `);
  }
}
