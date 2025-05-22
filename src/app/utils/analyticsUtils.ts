import { ChartData, ChartOptions, ChartType, TooltipItem } from 'chart.js';
import { shortMonthNames } from '../constants/time-constants';
import { AnalyticsChartConfig, AnalyticsRes } from '../types/analytics.types';
import { getPrimeNgHexColor } from './styleUtils';

import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

export const LIQUID_OZ_AS_WEIGHT_IN_POUNDS = 0.1;

/**
 * Returns an array of month abbreviations for a period of time
 *
 * @param startMonth - The starting month index of the lawn season (0 for January, 1 for February, etc.)
 * @param endMonth - The ending month index (0 for January, 1 for February, etc.). Defaults to the current month.
 * @returns An array of month abbreviations for the time period.
 */
export const getMonthAbbreviations = (
  startMonth = 1,
  endMonth = new Date().getMonth()
) => {
  const monthNames = shortMonthNames;
  const months: string[] = [];

  for (let i = startMonth; i <= endMonth; i++) {
    months.push(monthNames[i]);
  }

  return months;
};

/**
 * Returns the number of pounds of nitrogen in a fertilizer application
 *
 * @param poundsOfProduct - The weight of the fertilizer product in pounds
 * @param guaranteedAnalysisOfProduct - The guaranteed analysis of the fertilizer product (e.g., "10-10-10")
 * @returns The number of pounds of nitrogen in the fertilizer application
 */
export const getPoundsOfNInFertilizerApp = (
  poundsOfProduct: number,
  guaranteedAnalysisOfProduct: string
) => {
  const nRateOfProduct = +guaranteedAnalysisOfProduct.split('-')[0];

  const nPercent = nRateOfProduct / 100;
  const poundsOfN = poundsOfProduct * nPercent;

  return Math.round(poundsOfN * 100) / 100;
};

export const getMonthlyMowingChartConfig = (
  analyticsData: AnalyticsRes | undefined,
  uiOptions: { isDarkMode: boolean; isMobile: boolean }
): AnalyticsChartConfig<'bar'> => {
  const mowingCounts =
    analyticsData?.mowingAnalyticsData?.map((month) => +month.mowCount) || [];
  const startMonth = analyticsData?.mowingAnalyticsData?.[0]?.month || 1;
  const endMonth =
    analyticsData?.mowingAnalyticsData?.[
      analyticsData.mowingAnalyticsData.length - 1
    ]?.month;

  const highestMowingCount = Math.max(...mowingCounts);
  const grid = uiOptions.isDarkMode
    ? {
        color: 'rgba(200, 200, 200, 0.2)'
      }
    : undefined;

  return {
    title: 'Monthly Mow Counts',
    chartData: {
      labels: getMonthAbbreviations(startMonth, endMonth),
      datasets: [
        {
          type: 'bar',
          label: `Mowing Count`,
          data: mowingCounts
        }
      ]
    },
    options: {
      maintainAspectRatio: false,
      aspectRatio: uiOptions.isMobile ? 1.1 : 0.75,
      scales: {
        y: {
          beginAtZero: true,
          min: 0,
          max: Math.ceil(highestMowingCount * 1.25),
          grid
        },
        x: { grid }
      }
    }
  };
};

export const getFertilizerTimelineChartConfig = (
  analyticsData: AnalyticsRes | undefined,
  uiOptions: { isDarkMode: boolean; isMobile: boolean }
): AnalyticsChartConfig<'line'> => {
  const grid = uiOptions.isDarkMode
    ? {
        color: 'rgba(200, 200, 200, 0.2)'
      }
    : undefined;

  const data = (analyticsData?.fertilizerTimelineData || []).map((app) => {
    const isItLiquid =
      app.productQuantityUnit === 'oz' || app.productQuantityUnit === 'fl oz';

    const productWeight = isItLiquid
      ? app.productQuantity * LIQUID_OZ_AS_WEIGHT_IN_POUNDS
      : app.productQuantity;

    return getPoundsOfNInFertilizerApp(productWeight, app.guaranteedAnalysis);
  });

  return {
    title: 'Fertilizer Timeline',
    desc: 'Pounds of nitrogen per application. Generally a good range is 0.5-1.0 lbs/N (per 1000sqft) per application.',
    chartData: {
      labels: analyticsData?.fertilizerTimelineData?.map(
        (item) => item.applicationDate
      ),
      datasets: [
        {
          type: 'line',
          data,
          borderColor: getPrimeNgHexColor('teal.500'),
          tension: 0.4,
          label: 'Lbs/N per app'
        }
      ]
    },
    options: {
      maintainAspectRatio: false,
      aspectRatio: uiOptions.isMobile ? 1.1 : 0.75,
      scales: {
        y: {
          beginAtZero: true,
          min: 0,
          grid
        },
        x: { grid }
      }
    }
  };
};

export const getProductTypeDistributionChartConfig = (
  analyticsData: AnalyticsRes | undefined
): AnalyticsChartConfig<'pie'> => {
  const data = (analyticsData?.productTypeDistributionData || []).map(
    (item) => item.usageCount
  );
  const labels = (analyticsData?.productTypeDistributionData || []).map(
    (item) => item.category
  );

  return {
    title: 'Product Type Distribution',
    desc: 'Count/percentage products types used during the year per category across all apps.',
    chartData: {
      labels,
      datasets: [
        {
          type: 'pie',
          label: 'Product Type Distribution',
          data
        }
      ]
    },
    options: {
      maintainAspectRatio: false,
      aspectRatio: 1,
      plugins: {
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<'pie'>) => {
              const value = context.raw as number;
              const data = context.dataset?.data as number[] | undefined;
              const total = data?.reduce((acc, val) => acc + val, 0) ?? 0;
              const percentage =
                total > 0 ? ((value / total) * 100).toFixed(1) : '0';
              return `${context.label ?? ''}: ${value} (${percentage}%)`;
            }
          }
        },
        datalabels: {
          formatter: (value: number, ctx) => {
            const data = ctx.dataset?.data as number[] | undefined;
            const sum = data?.reduce((acc, val) => acc + val, 0) ?? 0;
            const percentage = sum > 0 ? ((value / sum) * 100).toFixed(1) : '0';
            return `${value}\n(${percentage}%)`;
          },
          color: '#fff',
          font: {
            weight: 'bold'
          }
        }
      }
    }
  };
};
