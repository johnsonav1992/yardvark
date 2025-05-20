import { ChartData, ChartOptions, ChartType } from 'chart.js';
import { shortMonthNames } from '../constants/time-constants';
import { AnalyticsChartConfig, AnalyticsRes } from '../types/analytics.types';

/**
 * Returns an array of month abbreviations from the start of the lawn season up to and including the current month.
 *
 * @param startMonth - The starting month index of the lawn season (0 for January, 1 for February, etc.)
 * @returns An array of month abbreviations from the lawn season start to the current month.
 */
export const getMonthAbbreviationsFromSeasonStartToToday = (startMonth = 1) => {
  const today = new Date();
  const monthNames = shortMonthNames;
  const currentMonthIndex = today.getMonth();
  const months: string[] = [];

  if (currentMonthIndex < startMonth) return months;

  for (let i = startMonth; i <= currentMonthIndex; i++) {
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

  const highestMowingCount = Math.max(...mowingCounts);
  const grid = uiOptions.isDarkMode
    ? {
        color: 'rgba(200, 200, 200, 0.2)'
      }
    : undefined;

  return {
    title: `Monthly Mow Counts (${new Date().getFullYear()})`,
    chartData: {
      labels: getMonthAbbreviationsFromSeasonStartToToday(),
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
    title: `Monthly Mow Counts (${new Date().getFullYear()})`,
    chartData: {
      labels: getMonthAbbreviationsFromSeasonStartToToday(),
      datasets: [
        {
          type: 'line',
          label: `Fertilizer`,
          data: [0, 2, 5, 7]
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
