import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEmbeddingTo384Dimensions1758997911640 implements MigrationInterface {
  name = 'UpdateEmbeddingTo384Dimensions1758997911640';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS entries_embedding_idx`);
    await queryRunner.query(
      `ALTER TABLE entries DROP COLUMN IF EXISTS embedding`,
    );
    await queryRunner.query(
      `ALTER TABLE entries ADD COLUMN embedding vector(384)`,
    );
    await queryRunner.query(
      `CREATE INDEX entries_embedding_idx ON entries USING hnsw (embedding vector_cosine_ops)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS entries_embedding_idx`);
    await queryRunner.query(
      `ALTER TABLE entries DROP COLUMN IF EXISTS embedding`,
    );
    await queryRunner.query(
      `ALTER TABLE entries ADD COLUMN embedding vector(768)`,
    );
    await queryRunner.query(
      `CREATE INDEX entries_embedding_idx ON entries USING hnsw (embedding vector_cosine_ops)`,
    );
  }
}
