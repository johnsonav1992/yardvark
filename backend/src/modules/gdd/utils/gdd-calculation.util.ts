/**
 * Calculates the Growing Degree Days (GDD) for a single day.
 * Uses the simple averaging method: ((max + min) / 2) - base
 *
 * @param params.baseTemperature - Minimum temperature threshold for growth
 * @param params.maxTemperature - Maximum temperature for the day
 * @param params.minTemperature - Minimum temperature for the day
 * @returns Daily GDD value (minimum of 0)
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
  const averageTemp = (maxTemperature + minTemperature) / 2;

  return Math.max(0, averageTemp - baseTemperature);
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
