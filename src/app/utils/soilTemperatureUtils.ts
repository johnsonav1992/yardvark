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

export type SoilConditionInsight = {
  icon: string;
  label: string;
  description: string;
};

/**
 * Returns contextual lawn care insights based on shallow soil temperature
 * and the user's grass type. Thresholds are in Fahrenheit; Celsius values
 * are converted before comparison.
 *
 * @param shallowTemp - The shallow (6cm) soil temperature reading.
 * @param tempUnit - The temperature unit ('fahrenheit' or 'celsius').
 * @param grassType - The user's grass type ('cool' or 'warm').
 * @returns A contextual insight about current soil conditions.
 */
export const getSoilTemperatureInsight = (
  shallowTemp: number,
  tempUnit: 'fahrenheit' | 'celsius',
  grassType: 'cool' | 'warm'
): SoilConditionInsight => {
  const tempF = tempUnit === 'celsius' ? shallowTemp * 1.8 + 32 : shallowTemp;

  if (grassType === 'cool') {
    return getCoolSeasonTempInsight(tempF);
  }

  return getWarmSeasonTempInsight(tempF);
};

const getCoolSeasonTempInsight = (tempF: number): SoilConditionInsight => {
  if (tempF < 40) {
    return {
      icon: 'ti ti-snowflake',
      label: 'Dormant',
      description: 'Soil is too cold. Your lawn is dormant until temps rise.'
    };
  }

  if (tempF < 55) {
    return {
      icon: 'ti ti-plant',
      label: 'Pre-emergent window',
      description:
        'Good time for crabgrass preventer. Your lawn is starting to wake up.'
    };
  }

  if (tempF < 65) {
    return {
      icon: 'ti ti-leaf',
      label: 'Normal growth',
      description: 'Ideal conditions for seeding, fertilizing, and overseeding.'
    };
  }

  if (tempF < 75) {
    return {
      icon: 'ti ti-sun',
      label: 'Slowing down',
      description:
        'Growth is slowing as temps rise. Raise your mowing height to reduce stress.'
    };
  }

  return {
    icon: 'ti ti-temperature-sun',
    label: 'Heat stress',
    description:
      'Your lawn is under heat stress. Be sure to water deeply and infrequently.'
  };
};

const getWarmSeasonTempInsight = (tempF: number): SoilConditionInsight => {
  if (tempF < 55) {
    return {
      icon: 'ti ti-snowflake',
      label: 'Dormant',
      description:
        'Soil is too cold. Your lawn is dormant until temps rise above 55°F.'
    };
  }

  if (tempF < 65) {
    return {
      icon: 'ti ti-plant',
      label: 'Greening up',
      description:
        'Your lawn is starting to green up. Hold off on heavy fertilizing until fully active.'
    };
  }

  if (tempF < 80) {
    return {
      icon: 'ti ti-leaf',
      label: 'Normal growth',
      description:
        'Ideal conditions for fertilizing, aerating, and dethatching.'
    };
  }

  return {
    icon: 'ti ti-temperature-sun',
    label: 'Hot',
    description:
      'Temperatures are high. Water deeply and less frequently to encourage deep roots.'
  };
};

/**
 * Returns a contextual insight based on soil moisture percentage
 * and the user's grass type.
 *
 * @param moisturePct - The soil moisture as a percentage (0–100).
 * @param grassType - The user's grass type ('cool' or 'warm').
 * @returns A contextual insight about soil moisture levels.
 */
export const getSoilMoistureInsight = (
  moisturePct: number,
  grassType: 'cool' | 'warm'
): SoilConditionInsight => {
  if (moisturePct < 15) {
    return {
      icon: 'ti ti-droplet-off',
      label: 'Dry',
      description:
        grassType === 'cool'
          ? 'Soil is dry. Cool-season grasses need consistent moisture — consider irrigating.'
          : 'Soil is dry. Water deeply if your lawn is actively growing.'
    };
  }

  if (moisturePct < 30) {
    return {
      icon: 'ti ti-droplet-half-2',
      label: 'Adequate',
      description:
        grassType === 'cool'
          ? 'Moisture levels look good for cool-season growth.'
          : 'Moisture levels look good for warm-season growth.'
    };
  }

  return {
    icon: 'ti ti-droplets',
    label: 'Saturated',
    description:
      grassType === 'cool'
        ? 'Soil is very moist. Hold off on watering to avoid fungal issues.'
        : 'Soil is very moist. Hold off on watering — warm-season grasses handle dry better than wet.'
  };
};

export type SoilTrend = {
  direction: 'rising' | 'falling' | 'stable';
  delta: number;
  icon: string;
};

/**
 * Computes a trend by comparing today's daily average against the average
 * of the last 3 forecast days. The daily averages array is expected to have
 * 15 entries (index 7 = today, indices 12-14 = days 5-7 of the forecast).
 *
 * @param dailyAverages - Array of daily average values (15 days, today at index 7).
 * @param threshold - Minimum absolute delta to count as rising/falling. Defaults to 1.
 * @returns A SoilTrend object, or null if data is insufficient.
 */
export const computeSoilTrend = (
  dailyAverages: (number | null)[],
  threshold = 1
): SoilTrend | null => {
  const todayVal = dailyAverages[7];

  if (todayVal === null) return null;

  const futureVals = dailyAverages
    .slice(12, 15)
    .filter((v): v is number => v !== null);

  if (futureVals.length === 0) return null;

  const futureAvg = futureVals.reduce((sum, v) => sum + v, 0) / futureVals.length;
  const delta = Math.round(futureAvg - todayVal);

  if (Math.abs(delta) < threshold) {
    return { direction: 'stable', delta: 0, icon: 'ti ti-arrow-narrow-right' };
  }

  if (delta > 0) {
    return { direction: 'rising', delta, icon: 'ti ti-trending-up' };
  }

  return { direction: 'falling', delta, icon: 'ti ti-trending-down' };
};

/**
 * Finds the most recent non-null value from an array of hourly data,
 * searching backwards from a given index.
 *
 * @param data - Array of hourly readings (may contain nulls).
 * @param fromIndex - The index to start searching backwards from.
 * @returns The most recent non-null value, or null if none found.
 */
export const getMostRecentValue = (
  data: (number | null)[],
  fromIndex: number
): number | null => {
  for (let i = Math.min(fromIndex, data.length - 1); i >= 0; i--) {
    if (data[i] !== null) return data[i];
  }

  return null;
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
