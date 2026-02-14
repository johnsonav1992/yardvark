import { MigrationInterface, QueryRunner } from 'typeorm';

export class GrandfatherExistingUsers1737862801000 implements MigrationInterface {
  name = 'GrandfatherExistingUsers1737862801000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO subscriptions (user_id, tier, status, created_at, updated_at)
      SELECT DISTINCT
        user_id,
        'lifetime'::subscription_tier,
        'active'::subscription_status,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM entries
      WHERE user_id IS NOT NULL
        AND user_id NOT IN (SELECT user_id FROM subscriptions)
      ON CONFLICT (user_id) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
