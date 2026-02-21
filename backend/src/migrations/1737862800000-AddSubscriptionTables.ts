import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubscriptionTables1737862800000 implements MigrationInterface {
	name = "AddSubscriptionTables1737862800000";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      CREATE TYPE subscription_tier AS ENUM ('free', 'monthly', 'yearly', 'lifetime');
    `);

		await queryRunner.query(`
      CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'incomplete', 'trialing');
    `);

		await queryRunner.query(`
      CREATE TABLE subscriptions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL UNIQUE,
        stripe_customer_id VARCHAR,
        stripe_subscription_id VARCHAR UNIQUE,
        tier subscription_tier DEFAULT 'free',
        status subscription_status DEFAULT 'active',
        current_period_start TIMESTAMPTZ,
        current_period_end TIMESTAMPTZ,
        cancel_at_period_end BOOLEAN DEFAULT false,
        canceled_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

		await queryRunner.query(`
      CREATE TABLE feature_usage (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL,
        feature_name VARCHAR NOT NULL,
        usage_count INTEGER DEFAULT 0,
        period_start TIMESTAMPTZ NOT NULL,
        period_end TIMESTAMPTZ NOT NULL,
        last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, feature_name, period_start)
      );
    `);

		await queryRunner.query(
			`CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_feature_usage_user_id ON feature_usage(user_id);`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_feature_usage_period ON feature_usage(period_start, period_end);`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS feature_usage;`);
		await queryRunner.query(`DROP TABLE IF EXISTS subscriptions;`);
		await queryRunner.query(`DROP TYPE IF EXISTS subscription_status;`);
		await queryRunner.query(`DROP TYPE IF EXISTS subscription_tier;`);
	}
}
