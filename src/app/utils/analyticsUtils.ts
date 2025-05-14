import { shortMonthNames } from '../constants/time-constants';

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
