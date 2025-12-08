import { GDD_MAX_TEMPERATURE } from '../models/gdd.constants';

/**
 * Calculates the Growing Degree Days (GDD) for a single day.
 * Uses the standard averaging method with temperature capping:
 * - Min temperature floored at base temp (no negative growth)
 * - Max temperature capped at 86°F/30°C (plants don't grow faster above this)
 * - Max temperature also floored at base temp (handles cold winter days)
 * - Result floored at 0 (no negative GDD)
 *
 * @param params.baseTemperature - Minimum temperature threshold for growth
 * @param params.maxTemperature - Maximum temperature for the day
 * @param params.minTemperature - Minimum temperature for the day
 * @returns Daily GDD value (minimum 0)
 */
export const getDailyGDDCalculation = ({
  baseTemperature,
  maxTemperature,
  minTemperature,
}: {
  baseTemperature: number;
  maxTemperature: number;
  minTemperature: number;
}): number => {
  // Floor temps at base (no growth below base), cap max at 86°F
  const cappedMinTemp = Math.max(minTemperature, baseTemperature);
  const cappedMaxTemp = Math.max(
    Math.min(maxTemperature, GDD_MAX_TEMPERATURE),
    baseTemperature,
  );
  const averageTemp = (cappedMaxTemp + cappedMinTemp) / 2;

  return averageTemp - baseTemperature;
};

/**
 * Calculates accumulated GDD from an array of daily temperature data
 *
 * @param dailyTemps - Array of daily high/low temperatures
 * @param baseTemperature - Base temperature for GDD calculation
 * @returns Total accumulated GDD
 */
export const calculateAccumulatedGDD = (
  dailyTemps: Array<{ high: number; low: number }>,
  baseTemperature: number,
): number => {
  return dailyTemps.reduce((total, day) => {
    return (
      total +
      getDailyGDDCalculation({
        baseTemperature,
        maxTemperature: day.high,
        minTemperature: day.low,
      })
    );
  }, 0);
};
