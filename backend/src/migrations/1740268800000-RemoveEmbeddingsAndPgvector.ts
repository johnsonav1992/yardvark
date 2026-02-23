import type { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveEmbeddingsAndPgvector1740268800000
	implements MigrationInterface
{
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX IF EXISTS entries_embedding_idx`);

		await queryRunner.query(
			`ALTER TABLE entries DROP COLUMN IF EXISTS embedding`,
		);

		await queryRunner.query(`DROP EXTENSION IF EXISTS vector`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

		await queryRunner.query(
			`ALTER TABLE entries ADD COLUMN embedding vector(384)`,
		);

		await queryRunner.query(
			`CREATE INDEX entries_embedding_idx ON entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`,
		);
	}
}
