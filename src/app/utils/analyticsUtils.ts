import { shortMonthNames } from '../constants/time-constants';
import { MowingAnalyticsRes } from '../types/analytics.types';

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
  analyticsData: MowingAnalyticsRes | undefined,
  isDarkMode: boolean
) => {
  const mowingCounts =
    analyticsData?.mowingAnalyticsData.map((month) => +month.mowCount) || [];

  const highestMowingCount = Math.max(...mowingCounts);

  return {
    title: `Monthly Mow Counts (${new Date().getFullYear()})`,
    chartData: {
      labels: getMonthAbbreviationsFromSeasonStartToToday(),
      datasets: [
        {
          type: 'bar' as const,
          label: `Mowing Count`,
          data: mowingCounts
        }
      ]
    },
    options: {
      maintainAspectRatio: false,
      aspectRatio: 0.75,
      scales: {
        y: {
          beginAtZero: true,
          min: 0,
          max: highestMowingCount * 1.25,
          grid: isDarkMode
            ? {
                color: 'rgba(200, 200, 200, 0.2)'
              }
            : undefined
        },
        x: {
          grid: isDarkMode
            ? {
                color: 'rgba(200, 200, 200, 0.2)'
              }
            : undefined
        }
      }
    }
  };
};
