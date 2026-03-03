import type { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveEntryEmbeddingColumn1772536623000
	implements MigrationInterface
{
	name = "RemoveEntryEmbeddingColumn1772536623000";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX IF EXISTS entries_embedding_idx`);
		await queryRunner.query(
			`ALTER TABLE entries DROP COLUMN IF EXISTS embedding`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);
		await queryRunner.query(
			`ALTER TABLE entries ADD COLUMN embedding vector(384)`,
		);
		await queryRunner.query(
			`CREATE INDEX entries_embedding_idx ON entries USING hnsw (embedding vector_cosine_ops)`,
		);
	}
}
