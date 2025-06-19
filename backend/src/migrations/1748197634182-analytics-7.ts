import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Analytics71748197634182 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      CREATE OR REPLACE FUNCTION get_user_analytics_v2(p_user_id VARCHAR)
      RETURNS JSON AS $$
      DECLARE
      mow_data JSON;
      fertilizer_data JSON;
      product_type_distribution JSON;
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
          p.name AS "productName",
          p.guaranteed_analysis AS "guaranteedAnalysis",
          ep.product_quantity AS "productQuantity",
          ep.product_quantity_unit AS "productQuantityUnit",
          COALESCE(SUM(ls.size) OVER (PARTITION BY e.id), 0) AS "totalSquareFeet"
        FROM
          entries e
          JOIN entry_products ep ON e.id = ep.entry_id
          JOIN products p ON ep.product_id = p.id
          LEFT JOIN entry_lawn_segments els ON e.id = els.entry_id
          LEFT JOIN lawn_segments ls ON els.lawn_segment_id = ls.id
        WHERE
          e.user_id = p_user_id
          AND p.category = 'fertilizer'
        ) f_inner
        ORDER BY f_inner."applicationDate"
      ) f;

      SELECT json_agg(row_to_json(d)) INTO product_type_distribution
      FROM (
      SELECT
        p.category AS "category",
        COUNT(*) AS "usageCount"
      FROM
        entries e
        JOIN entry_products ep ON e.id = ep.entry_id
        JOIN products p ON ep.product_id = p.id
      WHERE
        e.user_id = p_user_id
      GROUP BY
        p.category
      ORDER BY
        "usageCount" DESC
      ) d;

      RETURN json_build_object(
      'mowingAnalyticsData', mow_data,
      'fertilizerTimelineData', fertilizer_data,
      'productTypeDistributionData', product_type_distribution
      );
      END;
      $$ LANGUAGE plpgsql;
    `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP FUNCTION IF EXISTS get_user_analytics_v2(VARCHAR)`
		);
	}
}
