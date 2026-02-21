import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEmbeddingDimension1758973153543
	implements MigrationInterface
{
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE entries DROP COLUMN IF EXISTS embedding`,
		);
		await queryRunner.query(
			`ALTER TABLE entries ADD COLUMN embedding vector(1536)`,
		);
		await queryRunner.query(
			`CREATE INDEX IF NOT EXISTS entries_embedding_idx ON entries USING hnsw (embedding vector_cosine_ops)`,
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
	}
}
