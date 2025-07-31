import { MigrationInterface, QueryRunner } from 'typeorm';

export class Analytics9FixFertilizerQuery1753523360245
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION get_user_analytics_v2(p_user_id VARCHAR)
      RETURNS JSON AS $$
      DECLARE
      mow_data JSON;
      fertilizer_data JSON;
      product_type_distribution JSON;
      average_days_between_data JSON;
      BEGIN
      -- Existing mowing data query
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

      SELECT json_agg(row_to_json(avg_days)) INTO average_days_between_data
      FROM (
        WITH activity_dates AS (
          SELECT
            DATE_TRUNC('month', e.date) as month,
            EXTRACT(YEAR FROM e.date) as year,
            EXTRACT(MONTH FROM e.date) as month_num,
            1 as activity_type,  -- Mowing
            e.date,
            LAG(e.date) OVER (
              PARTITION BY 1
              ORDER BY e.date
            ) as prev_date
          FROM entries e
          JOIN entry_activities ea ON e.id = ea.entry_id
          WHERE e.user_id = p_user_id
            AND ea.activity_id = 1  -- Mowing activity
            AND e.date >= DATE_TRUNC('year', CURRENT_DATE)
            AND e.date <= CURRENT_DATE

          UNION ALL

          SELECT DISTINCT
            DATE_TRUNC('month', e.date) as month,
            EXTRACT(YEAR FROM e.date) as year,
            EXTRACT(MONTH FROM e.date) as month_num,
            2 as activity_type,  -- Fertilizer application
            e.date,
            LAG(e.date) OVER (
              PARTITION BY 2
              ORDER BY e.date
            ) as prev_date
          FROM entries e
          JOIN entry_products ep ON e.id = ep.entry_id
          JOIN products p ON ep.product_id = p.id
          WHERE e.user_id = p_user_id
            AND p.category = 'fertilizer'
            AND e.date >= DATE_TRUNC('year', CURRENT_DATE)
            AND e.date <= CURRENT_DATE
        ),
        monthly_averages AS (
          SELECT
            month,
            year,
            month_num,
            activity_type,
            AVG(
              CASE
                WHEN prev_date IS NOT NULL
                THEN EXTRACT(days FROM date - prev_date)
                ELSE NULL
              END
            ) as avg_days_between
          FROM activity_dates
          WHERE prev_date IS NOT NULL
          GROUP BY month, year, month_num, activity_type
        )
        SELECT
          ma.month,
          ma.year,
          ma.month_num as "monthNumber",
          ROUND(COALESCE(mow_avg.avg_days_between, 0)::numeric, 1) as "avgMowingDays",
          ROUND(COALESCE(fertilizer_avg.avg_days_between, 0)::numeric, 1) as "avgFertilizingDays"
        FROM (
          SELECT DISTINCT month, year, month_num
          FROM monthly_averages
        ) ma
        LEFT JOIN monthly_averages mow_avg ON (
          ma.month = mow_avg.month
          AND ma.year = mow_avg.year
          AND mow_avg.activity_type = 1
        )
        LEFT JOIN monthly_averages fertilizer_avg ON (
          ma.month = fertilizer_avg.month
          AND ma.year = fertilizer_avg.year
          AND fertilizer_avg.activity_type = 2
        )
        ORDER BY ma.year, ma.month_num
      ) avg_days;

      RETURN json_build_object(
      'mowingAnalyticsData', mow_data,
      'fertilizerTimelineData', fertilizer_data,
      'productTypeDistributionData', product_type_distribution,
      'averageDaysBetweenData', average_days_between_data
      );
      END;
      $$ LANGUAGE plpgsql;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION get_user_analytics_v2(p_user_id VARCHAR)
      RETURNS JSON AS $$
      DECLARE
      mow_data JSON;
      fertilizer_data JSON;
      product_type_distribution JSON;
      average_days_between_data JSON;
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

      SELECT json_agg(row_to_json(avg_days)) INTO average_days_between_data
      FROM (
        WITH activity_dates AS (
          SELECT
            DATE_TRUNC('month', e.date) as month,
            EXTRACT(YEAR FROM e.date) as year,
            EXTRACT(MONTH FROM e.date) as month_num,
            ea.activity_id,
            e.date,
            LAG(e.date) OVER (
              PARTITION BY ea.activity_id
              ORDER BY e.date
            ) as prev_date
          FROM entries e
          JOIN entry_activities ea ON e.id = ea.entry_id
          WHERE e.user_id = p_user_id
            AND ea.activity_id IN (1, 9)  -- Mowing (1) and Product Application (9) for fertilizing
            AND e.date >= DATE_TRUNC('year', CURRENT_DATE)
            AND e.date <= CURRENT_DATE
        ),
        monthly_averages AS (
          SELECT
            month,
            year,
            month_num,
            activity_id,
            AVG(
              CASE
                WHEN prev_date IS NOT NULL
                THEN EXTRACT(days FROM date - prev_date)
                ELSE NULL
              END
            ) as avg_days_between
          FROM activity_dates
          WHERE prev_date IS NOT NULL
          GROUP BY month, year, month_num, activity_id
        )
        SELECT
          ma.month,
          ma.year,
          ma.month_num as "monthNumber",
          ROUND(COALESCE(mow_avg.avg_days_between, 0)::numeric, 1) as "avgMowingDays",
          ROUND(COALESCE(fertilizer_avg.avg_days_between, 0)::numeric, 1) as "avgFertilizingDays"
        FROM (
          SELECT DISTINCT month, year, month_num
          FROM monthly_averages
        ) ma
        LEFT JOIN monthly_averages mow_avg ON (
          ma.month = mow_avg.month
          AND ma.year = mow_avg.year
          AND mow_avg.activity_id = 1
        )
        LEFT JOIN monthly_averages fertilizer_avg ON (
          ma.month = fertilizer_avg.month
          AND ma.year = fertilizer_avg.year
          AND fertilizer_avg.activity_id = 9
        )
        ORDER BY ma.year, ma.month_num
      ) avg_days;

      RETURN json_build_object(
      'mowingAnalyticsData', mow_data,
      'fertilizerTimelineData', fertilizer_data,
      'productTypeDistributionData', product_type_distribution,
      'averageDaysBetweenData', average_days_between_data
      );
      END;
      $$ LANGUAGE plpgsql;
    `);
  }
}
