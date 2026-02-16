import { subDays, addDays, getDay, addMonths, getMonth, getDate, getYear, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';

/**
 * Gets the start and end dates of a rolling two-week window centered around the current date.
 *
 * @returns An object containing the start and end dates.
 * @property {Date} startDate - 7 days before today.
 * @property {Date} endDate - 7 days after today.
 */
export const getRollingDateWindowAroundToday = () => {
  const today = new Date();
  const startDate = subDays(today, 7);
  const endDate = addDays(today, 7);

  return {
    startDate,
    endDate
  };
};

/**
 * Gets day labels for a rolling two-week window centered around the current day.
 *
 * @param opts - Optional parameters for label formatting.
 * @param opts.includeDates - Whether to include dates in the labels.
 * @param opts.shortDayNames - Whether to use short day names (e.g., Mon, Tue).
 * @param opts.tinyDayNames - Whether to use tiny day names (e.g., M, Tu).
 * @returns An array of strings representing the days in the window.
 */
export const getDayLabelsCenteredAroundToday = (opts?: {
  includeDates?: boolean;
  shortDayNames?: boolean;
  tinyDayNames?: boolean;
}) => {
  const today = new Date();
  const todayIndex = getDay(today);
  const labels = [];

  for (let i = -7; i <= 7; i++) {
    const currentDate = addDays(today, i);
    const dayIndex = (todayIndex + i + 7) % 7;

    let label;

    if (opts?.tinyDayNames) {
      const tinyDayNames = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];
      label = tinyDayNames[dayIndex];
    } else if (opts?.shortDayNames) {
      label = daysOfWeek[dayIndex].substring(0, 3);
    } else {
      label = daysOfWeek[dayIndex];
    }

    if (opts?.includeDates) {
      const dateStr = `${getMonth(currentDate) + 1}/${getDate(currentDate)}`;
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
  if (!timeString) {
    return null;
  }

  const today = new Date();
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  let result = setHours(today, hours || 0);
  result = setMinutes(result, minutes || 0);
  result = setSeconds(result, seconds || 0);
  result = setMilliseconds(result, 0);

  return result;
};

/**
 * Checks to see if a string is a valid time string in the format HH:mm:ss.
 */
export const isTimeString = (value: string): boolean => {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
  return timeRegex.test(value);
};

/**
 * Gets a specific day of the month for a given month date.
 * @param monthDate The date representing the month.
 * @param day The day of the month to get.
 * @returns A Date object for the specified day in the given month.
 */
export const getSpecificDayOfMonth = (monthDate: Date, day: number): Date => {
  const year = getYear(monthDate);
  const month = getMonth(monthDate);

  return new Date(year, month, day);
};
