import { ChartData, ChartOptions, ChartType } from 'chart.js';
import { shortMonthNames } from '../constants/time-constants';
import { AnalyticsChartConfig, AnalyticsRes } from '../types/analytics.types';

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

export const getMonthlyMowingChartConfig = (
  analyticsData: AnalyticsRes | undefined,
  uiOptions: { isDarkMode: boolean; isMobile: boolean }
): AnalyticsChartConfig<'bar'> => {
  const mowingCounts =
    analyticsData?.mowingAnalyticsData.map((month) => +month.mowCount) || [];
  const startMonth = analyticsData?.mowingAnalyticsData[0]?.month || 1;
  const endMonth =
    analyticsData?.mowingAnalyticsData[
      analyticsData.mowingAnalyticsData.length - 1
    ]?.month;

  const highestMowingCount = Math.max(...mowingCounts);
  const grid = uiOptions.isDarkMode
    ? {
        color: 'rgba(200, 200, 200, 0.2)'
      }
    : undefined;

  return {
    title: `Monthly Mow Counts (${new Date().getFullYear()})`,
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

  return {
    title: `Fertilizer Timeline (${new Date().getFullYear()})`,
    chartData: {
      labels: analyticsData?.fertilizerTimelineData.map(
        (item) => item.applicationDate
      ),
      datasets: [
        {
          type: 'line',
          label: `Fertilizer`,
          data:
            analyticsData?.fertilizerTimelineData.map(
              (item) => +item.productQuantity
            ) || []
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
