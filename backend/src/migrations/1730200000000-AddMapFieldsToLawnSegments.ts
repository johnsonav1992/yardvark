import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMapFieldsToLawnSegments1730200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE lawn_segments
      ADD COLUMN coordinates JSONB NULL,
      ADD COLUMN color VARCHAR(7) DEFAULT '#3388ff';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE lawn_segments
      DROP COLUMN IF EXISTS coordinates,
      DROP COLUMN IF EXISTS color;
    `);
  }
}
