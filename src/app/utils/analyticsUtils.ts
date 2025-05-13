import { shortMonthNames } from '../constants/time-constants';

/**
 * Returns an array of month abbreviations centered around the current month.
 * The array contains 12 month abbreviations, starting from the current month
 * and going back 6 months and forward 5 months.
 *
 * @returns {string[]} An array of month abbreviations.
 */
export const getMonthAbbreviationsCenteredAroundToday = () => {
  const today = new Date();
  const monthNames = shortMonthNames;

  const currentMonthIndex = today.getMonth();
  const months = [];

  for (let i = -6; i <= 5; i++) {
    const monthIndex = (currentMonthIndex + i + 12) % 12;
    months.push(monthNames[monthIndex]);
  }

  return months;
};
