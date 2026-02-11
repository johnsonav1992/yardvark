import { PrimeNGColorToken } from '../types/style.types';
import { getPrimeNgHexColor } from './styleUtils';
import { HOURS_IN_A_DAY } from './timeUtils';

/**
 * Returns the color to display for a given soil temperature.
 *
 * @param soilTemp - The soil temperature to get the color for.
 * @returns The color to display for the given soil temperature.
 */
export const getSoilTemperatureDisplayColor = (soilTemp: number) => {
  const temperatureColorMap: { [key: number]: PrimeNGColorToken } = {
    25: 'indigo.400',
    40: 'blue.500',
    45: 'green.600',
    50: 'amber.200',
    70: 'amber.400'
  };

  for (const [temp, color] of Object.entries(temperatureColorMap)) {
    if (soilTemp < Number(temp)) return getPrimeNgHexColor(color);
  }

  return getPrimeNgHexColor('red.400');
};

/**
 * Calculates the average of numeric data over a 24-hour period.
 * Filters out null values before averaging. Returns null if all values are null.
 *
 * @param numericData - An array of numeric readings taken over 24 hours.
 * @param options - An optional parameter to specify rounding precision.
 * @returns The average value rounded to the specified decimal places, or null if no valid data.
 */
export const calculate24HourNumericAverage = (
  numericData: (number | null)[],
  options?: { precision?: number }
): number | null => {
  const validData = numericData.filter((val): val is number => val !== null);

  if (validData.length === 0) return null;

  const total = validData.reduce((sum, temp) => sum + temp, 0);
  const precision = options?.precision ?? 1;

  return (
    Math.round((total / validData.length) * Math.pow(10, precision)) /
    Math.pow(10, precision)
  );
};

/**
 * Calculates the daily averages from an array of hourly numeric data.
 * The data is chunked into sub-arrays of 24 (representing each hour of one day)
 * to produce a daily average for as many days as the dataset can be split into.
 *
 * @param hourlyNumericData - An array of numeric readings taken hourly.
 * @param options - An optional parameter to specify rounding precision.
 * @returns An array of daily average values, rounded to the specified decimal places.
 */
export const getAllDailyNumericDataAverages = (
  hourlyNumericData: (number | null)[],
  options?: { precision?: number; multiplicationFactor?: number }
): (number | null)[] => {
  const dailyAverages: (number | null)[] = [];

  for (let i = 0; i < hourlyNumericData.length; i += HOURS_IN_A_DAY) {
    const dailyData = hourlyNumericData.slice(i, i + HOURS_IN_A_DAY);
    const dailyAverage = calculate24HourNumericAverage(dailyData, options);

    dailyAverages.push(
      dailyAverage !== null
        ? dailyAverage * (options?.multiplicationFactor || 1)
        : null
    );
  }

  return dailyAverages;
};
