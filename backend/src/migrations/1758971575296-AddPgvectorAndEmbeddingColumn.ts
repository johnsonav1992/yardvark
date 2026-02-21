import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPgvectorAndEmbeddingColumn1758971575296
	implements MigrationInterface
{
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

		await queryRunner.query(
			`ALTER TABLE entries ADD COLUMN embedding vector(3072)`,
		);

		await queryRunner.query(
			`CREATE INDEX IF NOT EXISTS entries_embedding_idx ON entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX IF EXISTS entries_embedding_idx`);

		await queryRunner.query(
			`ALTER TABLE entries DROP COLUMN IF EXISTS embedding`,
		);
	}
}
