import { MigrationInterface, QueryRunner } from "typeorm";

export class Analytics1747306082078 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      CREATE OR REPLACE FUNCTION get_user_analytics(p_user_id VARCHAR)
      RETURNS TABLE(month INT, year INT, mow_count BIGINT) AS $$
      BEGIN
        RETURN QUERY
        SELECT
          EXTRACT(MONTH FROM e.date)::INT as month,
          EXTRACT(YEAR FROM e.date)::INT as year,
          COUNT(ea.id) as mow_count
        FROM
          entries e
          JOIN entry_activities ea ON e.id = ea.entry_id
        WHERE
          e.user_id = p_user_id
          AND ea.activity_id = 1
          AND e.date >= DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 month'
          AND e.date <= CURRENT_DATE
        GROUP BY
          EXTRACT(YEAR FROM e.date),
          EXTRACT(MONTH FROM e.date)
        ORDER BY
          year, month;
      END;
      $$ LANGUAGE plpgsql;
    `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP FUNCTION IF EXISTS get_user_analytics(VARCHAR)`,
		);
	}
}
