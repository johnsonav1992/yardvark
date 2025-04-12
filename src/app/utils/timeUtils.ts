/**
 * Gets the start and end dates of a full week centered around the current date.
 *
 * @returns An object containing the start and end dates of the week.
 * @property {Date} startDate - The start date of the week (3 days before today).
 * @property {Date} endDate - The end date of the week (3 days after today).
 */
export const getRollingWeekStartAndEndDates = () => {
  const today = new Date();
  const startDate = new Date(today);
  const endDate = new Date(today);

  startDate.setDate(today.getDate() - 3);
  endDate.setDate(today.getDate() + 3);

  return {
    startDate,
    endDate
  };
};

/**
 * Gets the labels for the days of the week, centered around the current day.
 *
 * @param {Object} [opts] - Optional parameters.
 * @param {boolean} [opts.includeDates] - Whether to include dates in the labels.
 * @param {boolean} [opts.shortDayNames] - Whether to use short day names (e.g., Mon, Tue).
 * @returns {string[]} An array of strings representing the days of the week.
 */
export const getFullWeekOfDayLabelsCenteredAroundCurrentDay = (opts?: {
  includeDates?: boolean;
  shortDayNames?: boolean;
}) => {
  const today = new Date();
  const todayIndex = today.getDay();
  const labels = [];

  for (let i = -3; i <= 3; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + i);
    const dayIndex = (todayIndex + i + 7) % 7;

    let label = opts?.shortDayNames
      ? daysOfWeek[dayIndex].substring(0, 3)
      : daysOfWeek[dayIndex];

    if (opts?.includeDates) {
      const dateStr = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
      label += ` ${dateStr}`;
    }

    labels.push(label);
  }

  return labels;
};

/**
 * An array of strings representing the days of the week.
 */
export const daysOfWeek = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

/**
 * The number of hours in a day.
 */
export const HOURS_IN_A_DAY = 24;

/**
 * Simple debounce helper.
 * @param func The function to debounce.
 * @param delay The delay in milliseconds.
 * @returns The debounced function.
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
) => {
  let timer: ReturnType<typeof setTimeout>;

  return ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  }) as T;
};

/**
 * Converts a time string (HH:mm:ss) to a Date object.
 * @param timeString The time string to convert.
 * @returns A Date object with the time set, or null if the input is null.
 */
export const convertTimeStringToDate = (
  timeString: string | null
): Date | null => {
  if (!timeString) return null;

  const today = new Date();
  const [hours, minutes, seconds] = timeString.split(':').map(Number);

  today.setHours(hours || 0, minutes || 0, seconds || 0, 0);
  return today;
};

/**
 * Checks to see if a string is a valid time string in the format HH:mm:ss.
 */
export const isTimeString = (value: string): boolean => {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
  return timeRegex.test(value);
};
