import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWebhookEventsTable1770468039000 implements MigrationInterface {
	name = "AddWebhookEventsTable1770468039000";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      CREATE TABLE webhook_events (
        id SERIAL PRIMARY KEY,
        stripe_event_id VARCHAR NOT NULL UNIQUE,
        event_type VARCHAR NOT NULL,
        processed BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMPTZ
      );
    `);

		await queryRunner.query(
			`CREATE INDEX idx_webhook_events_stripe_event_id ON webhook_events(stripe_event_id);`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS webhook_events;`);
	}
}
