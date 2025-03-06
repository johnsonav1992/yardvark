/**
 * Gets the start and end dates of a full week centered around the current date.
 *
 * @returns An object containing the start and end dates of the week.
 * @property {Date} startDate - The start date of the week (3 days before today).
 * @property {Date} endDate - The end date of the week (3 days after today).
 */
export const getFullWeekStartAndEndDates = () => {
  const today = new Date();
  const startDate = new Date(today);
  const endDate = new Date(today);

  startDate.setDate(today.getDate() - 3);
  endDate.setDate(today.getDate() + 3);

  return {
    startDate,
    endDate,
  };
};

export const daysOfWeek = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const HOURS_IN_A_DAY = 24;
