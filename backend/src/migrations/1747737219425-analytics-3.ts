import type { MigrationInterface, QueryRunner } from "typeorm";

export class Analytics31747737219425 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      CREATE OR REPLACE FUNCTION get_user_analytics_v2(p_user_id VARCHAR)
      RETURNS JSON AS $$
      DECLARE
        mow_data JSON;
        fertilizer_data JSON;
      BEGIN
        SELECT json_agg(row_to_json(m)) INTO mow_data
        FROM (
          SELECT
            EXTRACT(MONTH FROM e.date)::INT AS "month",
            EXTRACT(YEAR FROM e.date)::INT AS "year",
            COUNT(ea.entry_id) AS "mowCount"
          FROM
            entries e
            JOIN entry_activities ea ON e.id = ea.entry_id
          WHERE
            e.user_id = p_user_id
            AND ea.activity_id = 1  -- Mowing
            AND e.date >= DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 month'
            AND e.date <= CURRENT_DATE
          GROUP BY
            EXTRACT(YEAR FROM e.date),
            EXTRACT(MONTH FROM e.date)
          ORDER BY
            "year", "month"
        ) m;

        SELECT json_agg(row_to_json(f)) INTO fertilizer_data
        FROM (
          SELECT *
          FROM (
            SELECT DISTINCT
              e.date::DATE AS "applicationDate",
              p.name AS "productName"
            FROM
              entries e
              JOIN entry_products ep ON e.id = ep.entry_id
              JOIN products p ON ep.product_id = p.id
            WHERE
              e.user_id = p_user_id
              AND p.category = 'fertilizer'
          ) f_inner
          ORDER BY f_inner."applicationDate"
        ) f;

        RETURN json_build_object(
          'mowingAnalyticsData', mow_data,
          'fertilizerTimelineData', fertilizer_data
        );
      END;
      $$ LANGUAGE plpgsql;
    `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP FUNCTION IF EXISTS get_user_analytics_v2(VARCHAR)`,
		);
	}
}
