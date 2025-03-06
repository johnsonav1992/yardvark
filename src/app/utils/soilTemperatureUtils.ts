import { PrimeNGColorToken } from '../types/types';
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
    70: 'amber.400',
  };

  for (const [temp, color] of Object.entries(temperatureColorMap)) {
    if (soilTemp < Number(temp)) return getPrimeNgHexColor(color);
  }

  return getPrimeNgHexColor('red.400');
};

/**
 * Calculates the average soil temperature over a 24-hour period.
 *
 * @param soilTemps - An array of soil temperature readings taken over 24 hours.
 * @returns The average soil temperature, rounded to one decimal place.
 */
export const calculate24HourSoilTempAverage = (soilTemps: number[]) => {
  const totalTemp = soilTemps.reduce((sum, temp) => sum + temp, 0);

  return Math.round((totalTemp / soilTemps.length) * 10) / 10;
};

/**
 * Takes an array of hourly soil temps
 * that will be chunked into sub-arrays of
 * 24 (for each hour of one day) to produce
 * a daily average for as many days as
 * the dataset can be split into.
 */
export const getAllDailySoilTemperatureAverages = (
  hourlyTemps: number[],
): number[] => {
  let dailyAverages: number[] = [];

  for (let i = 0; i < hourlyTemps.length; i += HOURS_IN_A_DAY) {
    const dailyTemps = hourlyTemps.slice(i, i + HOURS_IN_A_DAY);
    const dailyAverage = calculate24HourSoilTempAverage(dailyTemps);

    dailyAverages.push(dailyAverage);
  }

  return dailyAverages;
};
